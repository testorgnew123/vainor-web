import { Handler } from '@netlify/functions';
import { query } from './utils/db';
import { sendOrderConfirmation } from './utils/email';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const order_data = JSON.parse(event.body || '{}');

    // Validate minimum order amount for COD (₹1000)
    const MIN_COD_AMOUNT = 1000;
    if (order_data.total < MIN_COD_AMOUNT) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Cash on Delivery is only available for orders of ₹${MIN_COD_AMOUNT} or more` 
        }),
      };
    }

    // Generate order number
    const orderNumber = `NVL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Extract customer email from shipping address
    const customerEmail = order_data.shipping_address?.email || null;

    // Create order in database
    const orderResult = await query(
      `INSERT INTO orders (
        order_number, user_id, email, status, subtotal, tax, shipping_cost, discount, total,
        shipping_address, billing_address, payment_method, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        orderNumber,
        order_data.user_id || null,
        customerEmail,
        'pending',
        order_data.subtotal,
        order_data.tax,
        order_data.shipping_cost,
        order_data.discount || 0,
        order_data.total,
        JSON.stringify(order_data.shipping_address),
        JSON.stringify(order_data.billing_address),
        'cod',
        'pending', // Payment pending for COD
      ]
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of order_data.items) {
      await query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_image, 
          quantity, size, color, price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          String(item.product_id),
          item.product_name,
          item.product_image,
          item.quantity,
          item.size,
          item.color,
          item.price,
        ]
      );
    }

    // Stock deduction for database products
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of order_data.items) {
      const productId = String(item.product_id);

      if (UUID_REGEX.test(productId)) {
        try {
          await query(
            'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2',
            [item.quantity, productId]
          );
        } catch (stockErr) {
          console.warn(`Stock deduction error for product ${productId}:`, stockErr);
        }
      }
    }

    // Update coupon usage if applied
    if (order_data.coupon_code) {
      try {
        await query(
          'UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE code = $1',
          [order_data.coupon_code]
        );
      } catch (couponErr) {
        console.warn('Failed to update coupon usage:', couponErr);
      }
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmation({
        orderNumber,
        customerName: order_data.shipping_address?.full_name || 'Customer',
        customerEmail: customerEmail || '',
        items: order_data.items.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          size: item.size || '',
          color: item.color || '',
        })),
        subtotal: order_data.subtotal,
        discount: order_data.discount || 0,
        shippingCost: order_data.shipping_cost,
        tax: order_data.tax,
        total: order_data.total,
        shippingAddress: order_data.shipping_address,
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation:', emailError);
      // Non-fatal
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order_number: orderNumber,
        message: 'Order placed successfully. Payment to be collected on delivery.',
      }),
    };
  } catch (error) {
    console.error('COD order creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create order' }),
    };
  }
};
