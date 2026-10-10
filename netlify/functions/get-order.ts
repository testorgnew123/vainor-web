import { Handler } from '@netlify/functions';
import { query } from './utils/db';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { user_id, order_id } = JSON.parse(event.body || '{}');

    if (!order_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Order ID is required' }),
      };
    }

    // Get order details
    const orderResult = await query(
      `SELECT id, order_number, status, payment_status, payment_method, payment_id,
              tracking_number, shipped_at, delivered_at, created_at,
              shipping_address, subtotal, tax, shipping_cost, discount, total
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [order_id, user_id]
    );

    if (orderResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    // Get order items
    const itemsResult = await query(
      `SELECT id, product_id, product_name, product_image, size, color, quantity, price
       FROM order_items
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [order_id]
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        order: orderResult.rows[0],
        items: itemsResult.rows,
      }),
    };
  } catch (error) {
    console.error('Get order error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get order details' }),
    };
  }
};
