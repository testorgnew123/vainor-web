import { query } from './utils/db';

export async function handler(event: any) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const { category, subcategory, featured, new: isNew, search, limit, id, bestselling, discounted } = queryParams;

    // If specific product ID requested
    if (id) {
      // Skip DB query for non-UUID IDs (static frontend products like "6", "7", "8")
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(id)) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }

      const result = await query(
        `SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1 AND p.is_active = true`,
        [id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }

      const row = result.rows[0];
      const product = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || '',
        price: parseFloat(row.price),
        originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
        category: row.category || 'Men',
        subcategory: row.subcategory || '',
        images: row.images || [],
        sizes: row.sizes || [],
        colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : (row.colors || []),
        inStock: row.stock_quantity === null || row.stock_quantity === undefined || row.stock_quantity > 0,
        stockQuantity: row.stock_quantity,
        isActive: row.is_active,
        isFeatured: row.is_featured,
        isNew: row.is_new,
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ product }),
      };
    }

    // Best selling: special query with JOIN on order_items
    if (bestselling === 'true') {
      let bsSql = `
        SELECT
          p.id, p.name, p.slug, p.description, p.price, p.original_price,
          c.name AS category, p.subcategory, p.images, p.sizes, p.colors,
          p.stock_quantity, p.is_active, p.is_featured, p.is_new,
          p.created_at,
          COALESCE(SUM(oi.quantity), 0) AS total_sold
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN order_items oi ON oi.product_id = p.id::text
        LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
        WHERE p.is_active = true
        GROUP BY p.id, c.name
        ORDER BY total_sold DESC
      `;
      const bsParams: any[] = [];
      if (limit) {
        bsSql += ` LIMIT $1`;
        bsParams.push(parseInt(limit));
      }

      const bsResult = await query(bsSql, bsParams);
      const bsProducts = bsResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || '',
        price: parseFloat(row.price),
        originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
        category: row.category || 'Men',
        subcategory: row.subcategory || '',
        images: row.images || [],
        sizes: row.sizes || [],
        colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : (row.colors || []),
        inStock: row.stock_quantity === null || row.stock_quantity === undefined || row.stock_quantity > 0,
        stockQuantity: row.stock_quantity,
        isActive: row.is_active,
        isFeatured: row.is_featured,
        isNew: row.is_new,
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ products: bsProducts }),
      };
    }

    // Build query for multiple products
    let sql = `
      SELECT
        p.id, p.name, p.slug, p.description, p.price, p.original_price,
        c.name AS category, p.subcategory, p.images, p.sizes, p.colors,
        p.stock_quantity, p.is_active, p.is_featured, p.is_new,
        p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND LOWER(c.name) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    if (subcategory) {
      sql += ` AND LOWER(p.subcategory) = LOWER($${paramIndex})`;
      params.push(subcategory);
      paramIndex++;
    }

    if (featured === 'true') {
      sql += ` AND p.is_featured = true`;
    }

    if (isNew === 'true') {
      sql += ` AND p.is_new = true`;
    }

    if (discounted === 'true') {
      sql += ` AND p.original_price IS NOT NULL AND p.original_price > p.price`;
    }

    if (search) {
      sql += ` AND (LOWER(p.name) LIKE LOWER($${paramIndex}) OR LOWER(p.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC`;

    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    const result = await query(sql, params);

    // Transform the data to match the expected format
    const products = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      price: parseFloat(row.price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      category: row.category || 'Men',
      subcategory: row.subcategory || '',
      images: row.images || [],
      sizes: row.sizes || [],
      colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : (row.colors || []),
      inStock: row.stock_quantity === null || row.stock_quantity === undefined || row.stock_quantity > 0,
      stockQuantity: row.stock_quantity,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      isNew: row.is_new,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ products }),
    };
  } catch (error: any) {
    console.error('Get products error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch products', details: error.message }),
    };
  }
}
