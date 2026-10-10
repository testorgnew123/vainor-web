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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { product_id } = JSON.parse(event.body || '{}');

    if (!product_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'product_id is required' })
      };
    }

    // Insert view record (non-fatal if table doesn't exist)
    try {
      await query(
        'INSERT INTO product_views (product_id, viewed_at) VALUES ($1, NOW())',
        [product_id]
      );
    } catch (dbError) {
      console.warn('Failed to track product view:', dbError);
      // Don't fail the request if tracking fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Track view error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
