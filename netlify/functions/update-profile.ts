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
    const { first_name, last_name, phone } = JSON.parse(event.body || '{}');

    console.log(`📝 Updating profile for user ${auth.userId}:`, { first_name, last_name, phone });

    // Update users table (now contains all profile data)
    const result = await query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, first_name, last_name, phone',
      [first_name, last_name, phone, auth.userId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ User ${auth.userId} not found in database`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const updatedUser = result.rows[0];
    console.log(`✅ Profile updated successfully for user ${auth.userId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: updatedUser,
      }),
    };
  } catch (error: any) {
    console.error('❌ Update profile error:', error);
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update profile',
        details: error.message
      })
    };
  }
};
