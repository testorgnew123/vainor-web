import { Handler } from '@netlify/functions';
import { query } from './utils/db';
import { verifyCustomerToken } from './utils/auth';

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
    const auth = verifyCustomerToken(event.headers.authorization);
    if (!auth) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' }),
      };
    }

    // Claim all guest orders that match this email
    const result = await query(
      `UPDATE orders
       SET user_id = $1
       WHERE email = $2
         AND user_id IS NULL
       RETURNING id, order_number`,
      [auth.userId, email]
    );

    const claimedCount = result.rows.length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        claimed: claimedCount,
        orders: result.rows.map((r: any) => r.order_number),
      }),
    };
  } catch (error) {
    console.error('Claim guest orders error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to claim guest orders' }),
    };
  }
};
