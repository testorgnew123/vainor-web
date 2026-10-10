import { Handler } from '@netlify/functions';
import { query } from './utils/db';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Coupon code is required' }),
      };
    }

    const result = await query(
      `SELECT * FROM coupons 
       WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Coupon not found' }),
      };
    }

    const coupon = result.rows[0];

    // Validate expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Coupon expired' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: coupon }),
    };
  } catch (error) {
    console.error('Get coupon error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};