import { query } from './utils/db';

export async function handler(event: any) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Get published blog posts for the public site
    const result = await query(`
      SELECT id, title, slug, excerpt, featured_image, category, tags,
             meta_title, meta_description, author_name, published_at, view_count
      FROM blog_posts 
      WHERE status = 'published' AND published_at <= NOW()
      ORDER BY published_at DESC
    `);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
      body: JSON.stringify({ posts: result.rows }),
    };
  } catch (error) {
    console.error('Get blog posts error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
