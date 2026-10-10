import { Handler } from '@netlify/functions';
import { query } from './utils/db';
import { verifyCustomerToken } from './utils/auth';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const auth = verifyCustomerToken(event.headers.authorization);
  if (!auth) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    // LIST addresses
    if (action === 'list') {
      const result = await query(
        'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [auth.userId]
      );
      return { statusCode: 200, headers, body: JSON.stringify({ data: result.rows }) };
    }

    // CREATE address
    if (action === 'create') {
      const { label, full_name, street_address, city, state, postal_code, phone } = body;

      // If this is the first address, make it default
      const countResult = await query(
        'SELECT COUNT(*) as count FROM addresses WHERE user_id = $1',
        [auth.userId]
      );
      const isDefault = parseInt(countResult.rows[0].count) === 0;

      const result = await query(
        `INSERT INTO addresses (user_id, label, full_name, street_address, city, state, postal_code, country, phone, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'India', $8, $9)
         RETURNING *`,
        [auth.userId, label, full_name, street_address, city, state, postal_code, phone, isDefault]
      );
      return { statusCode: 201, headers, body: JSON.stringify({ data: result.rows[0] }) };
    }

    // UPDATE address
    if (action === 'update') {
      const { id, label, full_name, street_address, city, state, postal_code, phone } = body;
      const result = await query(
        `UPDATE addresses SET label = $1, full_name = $2, street_address = $3, city = $4,
         state = $5, postal_code = $6, phone = $7, updated_at = NOW()
         WHERE id = $8 AND user_id = $9 RETURNING *`,
        [label, full_name, street_address, city, state, postal_code, phone, id, auth.userId]
      );
      if (result.rows.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Address not found' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ data: result.rows[0] }) };
    }

    // DELETE address
    if (action === 'delete') {
      const { id } = body;
      await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, auth.userId]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // SET DEFAULT
    if (action === 'set_default') {
      const { id } = body;
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [auth.userId]);
      await query('UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2', [id, auth.userId]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (error) {
    console.error('Addresses error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
