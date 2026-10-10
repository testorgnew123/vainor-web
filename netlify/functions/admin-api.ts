import { query } from './utils/db';
import { sendOrderStatusUpdate } from './utils/email';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Middleware to verify admin token
export function verifyAdminToken(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function handler(event: any) {
  const admin = verifyAdminToken(event.headers.authorization);
  
  if (!admin) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  // Get path from query string or from URL path
  const queryParams = event.queryStringParameters || {};
  let path = queryParams.path || event.path.replace('/.netlify/functions/admin-api/', '').replace('/.netlify/functions/admin-api', '');
  
  // Clean up path - strip inline query string if present (e.g. "analytics/views?days=30")
  if (path.includes('?')) path = path.split('?')[0];
  if (path.startsWith('/')) path = path.slice(1);
  if (!path) path = 'dashboard/stats';
  
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // ============================================
    // DASHBOARD STATS
    // ============================================
    if (path === 'dashboard/stats' && method === 'GET') {
      // Total orders
      const ordersResult = await query('SELECT COUNT(*) as total FROM orders');
      const totalOrders = parseInt(ordersResult.rows[0].total);

      // Total revenue
      const revenueResult = await query(
        "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'paid'"
      );
      const totalRevenue = parseFloat(revenueResult.rows[0].total);

      // Today's orders
      const todayOrdersResult = await query(
        "SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = CURRENT_DATE"
      );
      const todayOrders = parseInt(todayOrdersResult.rows[0].total);

      // Pending orders
      const pendingResult = await query(
        "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'"
      );
      const pendingOrders = parseInt(pendingResult.rows[0].total);

      // Low stock products (less than 5)
      const lowStockResult = await query(
        "SELECT COUNT(*) as total FROM products WHERE stock_quantity < 5 AND is_active = true"
      );
      const lowStockProducts = parseInt(lowStockResult.rows[0].total);

      // Recent orders
      const recentOrdersResult = await query(
        `SELECT id, order_number, status, total, created_at 
         FROM orders ORDER BY created_at DESC LIMIT 5`
      );

      // Revenue last 7 days (generate all days even if no orders)
      const revenueChartResult = await query(`
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date as date
        )
        SELECT
          ds.date,
          COALESCE(SUM(o.total), 0) as revenue
        FROM date_series ds
        LEFT JOIN orders o ON DATE(o.created_at) = ds.date AND o.payment_status = 'paid'
        GROUP BY ds.date
        ORDER BY ds.date
      `);

      return {
        statusCode: 200,
        body: JSON.stringify({
          totalOrders,
          totalRevenue,
          todayOrders,
          pendingOrders,
          lowStockProducts,
          recentOrders: recentOrdersResult.rows,
          revenueChart: revenueChartResult.rows,
        }),
      };
    }

    // ============================================
    // PRODUCTS MANAGEMENT
    // ============================================
    if (path === 'products' && method === 'GET') {
      const result = await query(
        'SELECT * FROM products ORDER BY created_at DESC'
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ products: result.rows }),
      };
    }

    if (path === 'products' && method === 'POST') {
      const {
        name, sku, slug, description, price, original_price, category_id,
        subcategory, images, sizes, colors, stock_quantity,
        is_active, is_featured, is_new
      } = body;

      const result = await query(
        `INSERT INTO products (name, sku, slug, description, price, original_price, category_id,
          subcategory, images, sizes, colors, stock_quantity, is_active, is_featured, is_new)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [name, sku, slug, description, price, original_price, category_id || null,
         subcategory, images, sizes, JSON.stringify(colors), stock_quantity,
         is_active ?? true, is_featured ?? false, is_new ?? false]
      );

      return {
        statusCode: 201,
        body: JSON.stringify({ product: result.rows[0] }),
      };
    }

    if (path.startsWith('products/') && method === 'PUT') {
      const productId = path.split('/')[1];
      const {
        name, sku, slug, description, price, original_price, category_id,
        subcategory, images, sizes, colors, stock_quantity,
        is_active, is_featured, is_new
      } = body;

      const result = await query(
        `UPDATE products SET
          name = $1, sku = $2, slug = $3, description = $4, price = $5, original_price = $6,
          category_id = $7, subcategory = $8, images = $9, sizes = $10, colors = $11,
          stock_quantity = $12, is_active = $13, is_featured = $14, is_new = $15,
          updated_at = NOW()
         WHERE id = $16 RETURNING *`,
        [name, sku, slug, description, price, original_price, category_id || null,
         subcategory, images, sizes, JSON.stringify(colors), stock_quantity,
         is_active, is_featured, is_new, productId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ product: result.rows[0] }),
      };
    }

    if (path.startsWith('products/') && method === 'DELETE') {
      const productId = path.split('/')[1];
      await query('DELETE FROM products WHERE id = $1', [productId]);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    // ============================================
    // INVENTORY MANAGEMENT
    // ============================================
    if (path === 'inventory/update' && method === 'POST') {
      const { product_id, quantity_change, change_type, notes } = body;

      // Get current stock
      const currentResult = await query(
        'SELECT stock_quantity FROM products WHERE id = $1',
        [product_id]
      );

      if (currentResult.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }

      const previousQuantity = currentResult.rows[0].stock_quantity;
      const newQuantity = previousQuantity + quantity_change;

      if (newQuantity < 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Stock cannot be negative' }),
        };
      }

      // Update product stock
      await query(
        'UPDATE products SET stock_quantity = $1 WHERE id = $2',
        [newQuantity, product_id]
      );

      // Log inventory change
      await query(
        `INSERT INTO inventory_log (product_id, change_type, quantity_change, previous_quantity, new_quantity, notes, admin_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [product_id, change_type, quantity_change, previousQuantity, newQuantity, notes, admin.id]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, newQuantity }),
      };
    }

    if (path === 'inventory/log' && method === 'GET') {
      const result = await query(
        `SELECT il.*, p.name as product_name 
         FROM inventory_log il
         LEFT JOIN products p ON il.product_id::uuid = p.id
         ORDER BY il.created_at DESC LIMIT 100`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ logs: result.rows }),
      };
    }

    if (path === 'inventory/low-stock' && method === 'GET') {
      const result = await query(
        `SELECT id, name, stock_quantity, images 
         FROM products 
         WHERE stock_quantity < 10 AND is_active = true
         ORDER BY stock_quantity ASC`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ products: result.rows }),
      };
    }

    // ============================================
    // ORDERS MANAGEMENT
    // ============================================
    if (path === 'orders' && method === 'GET') {
      const result = await query(
        `SELECT o.*, 
          (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
         FROM orders o ORDER BY o.created_at DESC`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ orders: result.rows }),
      };
    }

    if (path.startsWith('orders/') && path.endsWith('/status') && method === 'PUT') {
      const orderId = path.split('/')[1];
      const { status, tracking_number } = body;

      let updateQuery = 'UPDATE orders SET status = $1, updated_at = NOW()';
      const params: any[] = [status];
      let paramIndex = 2;

      if (tracking_number) {
        updateQuery += `, tracking_number = $${paramIndex}`;
        params.push(tracking_number);
        paramIndex++;
      }

      if (status === 'shipped') {
        updateQuery += `, shipped_at = NOW()`;
      } else if (status === 'delivered') {
        updateQuery += `, delivered_at = NOW()`;
      }

      updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
      params.push(orderId);

      const result = await query(updateQuery, params);
      const updatedOrder = result.rows[0];

      // Send status update email to customer (non-fatal)
      if (updatedOrder) {
        try {
          const shippingAddr = typeof updatedOrder.shipping_address === 'string'
            ? JSON.parse(updatedOrder.shipping_address)
            : updatedOrder.shipping_address;

          const customerEmail = shippingAddr?.email || updatedOrder.email;

          if (!customerEmail || !customerEmail.includes('@')) {
            console.error(`❌ Cannot send status email for order ${updatedOrder.order_number}: Invalid customer email: ${customerEmail}`);
          } else {
            await sendOrderStatusUpdate({
              orderNumber: updatedOrder.order_number,
              customerName: shippingAddr?.full_name || 'Customer',
              customerEmail,
              status,
              trackingNumber: tracking_number || updatedOrder.tracking_number,
            });
            console.log(`✅ Status update email sent to customer for order ${updatedOrder.order_number}`);
          }
        } catch (emailError: any) {
          console.error(`❌ Failed to send order status email for ${updatedOrder.order_number}:`, emailError);
          console.error('   Error details:', {
            message: emailError.message,
            code: emailError.code,
            command: emailError.command,
          });
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ order: updatedOrder }),
      };
    }

    // ============================================
    // BLOG MANAGEMENT
    // ============================================
    if (path === 'blog/posts' && method === 'GET') {
      const result = await query(
        'SELECT * FROM blog_posts ORDER BY created_at DESC'
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ posts: result.rows }),
      };
    }

    if (path === 'blog/posts' && method === 'POST') {
      const {
        title, slug, excerpt, content, featured_image, category, tags,
        meta_title, meta_description, meta_keywords, canonical_url, og_image,
        status, published_at, scheduled_at
      } = body;

      const result = await query(
        `INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, category, tags,
          meta_title, meta_description, meta_keywords, canonical_url, og_image,
          status, author_id, author_name, published_at, scheduled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [title, slug, excerpt, content, featured_image, category, tags || [],
         meta_title, meta_description, meta_keywords || [], canonical_url, og_image,
         status || 'draft', admin.id, admin.name, 
         status === 'published' ? new Date() : published_at, scheduled_at]
      );

      return {
        statusCode: 201,
        body: JSON.stringify({ post: result.rows[0] }),
      };
    }

    if (path.startsWith('blog/posts/') && method === 'PUT') {
      const postId = path.split('/')[2];
      const {
        title, slug, excerpt, content, featured_image, category, tags,
        meta_title, meta_description, meta_keywords, canonical_url, og_image,
        status, published_at, scheduled_at
      } = body;

      const result = await query(
        `UPDATE blog_posts SET 
          title = $1, slug = $2, excerpt = $3, content = $4, featured_image = $5,
          category = $6, tags = $7, meta_title = $8, meta_description = $9,
          meta_keywords = $10, canonical_url = $11, og_image = $12, status = $13,
          published_at = $14, scheduled_at = $15, updated_at = NOW()
         WHERE id = $16 RETURNING *`,
        [title, slug, excerpt, content, featured_image, category, tags || [],
         meta_title, meta_description, meta_keywords || [], canonical_url, og_image,
         status, published_at, scheduled_at, postId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ post: result.rows[0] }),
      };
    }

    if (path.startsWith('blog/posts/') && method === 'DELETE') {
      const postId = path.split('/')[2];
      await query('DELETE FROM blog_posts WHERE id = $1', [postId]);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === 'blog/categories' && method === 'GET') {
      const result = await query('SELECT * FROM blog_categories ORDER BY name');
      return {
        statusCode: 200,
        body: JSON.stringify({ categories: result.rows }),
      };
    }

    // ============================================
    // ANALYTICS
    // ============================================
    if (path === 'analytics/sales' && method === 'GET') {
      const result = await query('SELECT * FROM product_sales_stats LIMIT 20');
      return {
        statusCode: 200,
        body: JSON.stringify({ sales: result.rows }),
      };
    }

    if (path === 'analytics/revenue' && method === 'GET') {
      const days = queryParams.days || '30';
      // Generate complete date series with all days, even those with no orders
      const dailyResult = await query(`
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '${parseInt(days) - 1} days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date as date
        )
        SELECT
          ds.date,
          COALESCE(SUM(o.total), 0) as revenue,
          COUNT(o.id) as orders
        FROM date_series ds
        LEFT JOIN orders o ON DATE(o.created_at) = ds.date AND o.payment_status = 'paid'
        GROUP BY ds.date
        ORDER BY ds.date
      `);

      const byProductResult = await query(`
        SELECT oi.product_id, oi.product_name, p.sku,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.price * oi.quantity) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id::text
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days' AND o.payment_status = 'paid'
        GROUP BY oi.product_id, oi.product_name, p.sku
        ORDER BY total_revenue DESC
        LIMIT 20
      `);

      return {
        statusCode: 200,
        body: JSON.stringify({ daily: dailyResult.rows, byProduct: byProductResult.rows }),
      };
    }

    if (path === 'analytics/views' && method === 'GET') {
      const days = queryParams.days || '30';
      let viewProducts: any[] = [];
      try {
        const result = await query(`
          SELECT pv.product_id, p.name as product_name, p.sku, COUNT(*) as view_count
          FROM product_views pv
          LEFT JOIN products p ON pv.product_id = p.id::text
          WHERE pv.viewed_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
          GROUP BY pv.product_id, p.name, p.sku
          ORDER BY view_count DESC
          LIMIT 10
        `);
        viewProducts = result.rows;
      } catch (e) {
        // product_views table may not exist yet
        console.error('product_views query failed:', e);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ products: viewProducts }),
      };
    }

    if (path === 'analytics/subcategory-revenue' && method === 'GET') {
      const days = queryParams.days || '30';
      const result = await query(`
        SELECT
          COALESCE(p.subcategory, 'Other') as subcategory,
          SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id::text
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days' AND o.payment_status = 'paid'
        GROUP BY p.subcategory
        ORDER BY revenue DESC
      `);
      return {
        statusCode: 200,
        body: JSON.stringify({ subcategories: result.rows }),
      };
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================
    if (path === 'users' && method === 'GET') {
      let result;
      try {
        result = await query(`
          SELECT
            u.id, u.email, u.first_name, u.last_name, u.created_at,
            u.phone, NULL as avatar_url, COALESCE(u.is_blocked, false) as is_blocked,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id::text = u.id::text) as orders_count,
            (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id::text = u.id::text AND o.payment_status = 'paid') as total_spent
          FROM users u
          ORDER BY u.created_at DESC
        `);
      } catch (e) {
        // Fallback if phone/is_blocked columns don't exist yet
        console.error('Users query error:', e);
        result = await query(`
          SELECT
            u.id, u.email, u.first_name, u.last_name, u.created_at,
            NULL as phone, NULL as avatar_url, false as is_blocked,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id::text = u.id::text) as orders_count,
            (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id::text = u.id::text AND o.payment_status = 'paid') as total_spent
          FROM users u
          ORDER BY u.created_at DESC
        `);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ users: result.rows }),
      };
    }

    if (path.startsWith('users/') && path.endsWith('/block') && method === 'PUT') {
      const userId = path.split('/')[1];
      const { is_blocked } = body;

      await query(
        'UPDATE users SET is_blocked = $1 WHERE id = $2',
        [is_blocked, userId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, is_blocked }),
      };
    }

    if (path.startsWith('users/') && path.endsWith('/orders') && method === 'GET') {
      const userId = path.split('/')[1];

      const result = await query(
        `SELECT o.*,
          (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
         FROM orders o
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC`,
        [userId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ orders: result.rows }),
      };
    }

    // ============================================
    // CATEGORIES
    // ============================================
    if (path === 'categories' && method === 'GET') {
      const result = await query('SELECT * FROM categories ORDER BY name');
      return {
        statusCode: 200,
        body: JSON.stringify({ categories: result.rows }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error) {
    console.error('Admin API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
