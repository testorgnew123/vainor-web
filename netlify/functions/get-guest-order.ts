import { Handler } from '@netlify/functions';
import { query } from './utils/db';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { order_number, email } = JSON.parse(event.body || '{}');

    if (!order_number || !email) {
      console.log('❌ Missing required fields');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Order number and email are required'
        }),
      };
    }

    console.log(`📦 Guest order lookup: ${order_number}`);

    // Fetch order from database
    const orderResult = await query(
      `SELECT
        o.*,
        o.shipping_address::text as shipping_address_raw
       FROM orders o
       WHERE o.order_number = $1
       LIMIT 1`,
      [order_number.trim()]
    );

    if (orderResult.rows.length === 0) {
      console.log(`❌ Order not found: ${order_number}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Order not found. Please check your order number and email.'
        }),
      };
    }

    const order = orderResult.rows[0];

    // Parse shipping address to verify email
    let shippingAddress;
    try {
      shippingAddress = typeof order.shipping_address_raw === 'string'
        ? JSON.parse(order.shipping_address_raw)
        : order.shipping_address_raw;
    } catch (e) {
      console.error('❌ Failed to parse shipping address:', e);
      shippingAddress = order.shipping_address;
    }

    // Verify email matches (case-insensitive)
    const orderEmail = (shippingAddress?.email || order.email || '').toLowerCase().trim();
    const providedEmail = email.toLowerCase().trim();

    if (!orderEmail || orderEmail !== providedEmail) {
      console.log(`❌ Email mismatch for order ${order_number}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Order not found. Please check your order number and email.'
        }),
      };
    }

    // Fetch order items
    const itemsResult = await query(
      `SELECT
        id,
        product_id,
        product_name,
        product_image,
        size,
        color,
        quantity,
        price
       FROM order_items
       WHERE order_id = $1
       ORDER BY created_at`,
      [order.id]
    );

    console.log(`✅ Found order ${order_number} with ${itemsResult.rows.length} items`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          payment_id: order.payment_id,
          tracking_number: order.tracking_number,
          shipped_at: order.shipped_at,
          delivered_at: order.delivered_at,
          created_at: order.created_at,
          shipping_address: shippingAddress,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping_cost: order.shipping_cost,
          discount: order.discount,
          total: order.total,
        },
        items: itemsResult.rows,
      }),
    };
  } catch (error: any) {
    console.error('❌ Get guest order error:', error);
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch order. Please try again later.'
      }),
    };
  }
};
