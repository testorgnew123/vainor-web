import { query } from './utils/db';

export async function handler(event: any) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Slug is required' }),
      };
    }

    // Get the blog post
    const result = await query(`
      SELECT id, title, slug, excerpt, content, featured_image, category, tags,
             meta_title, meta_description, meta_keywords, canonical_url, og_image,
             author_name, published_at, view_count
      FROM blog_posts 
      WHERE slug = $1 AND status = 'published' AND published_at <= NOW()
    `, [slug]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Post not found' }),
      };
    }

    // Increment view count
    await query(
      'UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1',
      [slug]
    );

    const post = result.rows[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
      body: JSON.stringify({ post }),
    };
  } catch (error) {
    console.error('Get blog post error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
