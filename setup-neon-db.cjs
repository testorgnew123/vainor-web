#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Neon Database for Atelier E-commerce');
  console.log('==================================================\n');

  // Read DATABASE_URL from .env file
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const databaseUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

  if (!databaseUrlMatch) {
    console.error('❌ Error: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const databaseUrl = databaseUrlMatch[1].trim();
  console.log('✓ DATABASE_URL found in .env\n');

  // Read schema file
  const schemaPath = path.join(__dirname, 'neon_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  console.log('✓ Schema file loaded\n');

  // Connect to database
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📡 Connecting to Neon database...\n');
    await client.connect();
    console.log('✓ Connected to database\n');

    console.log('📝 Creating database schema...\n');
    await client.query(schema);
    console.log('✓ Schema created successfully\n');

    // Verify by checking tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('✅ Database setup complete!\n');
    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check coupons
    const coupons = await client.query('SELECT code, description FROM coupons;');
    console.log('\nSample coupons added:');
    coupons.rows.forEach(coupon => {
      console.log(`  - ${coupon.code}: ${coupon.description}`);
    });

    console.log('\n🎉 Success! Your database is ready.\n');
    console.log('Next steps:');
    console.log('1. Start the development server:');
    console.log('   npm install -g netlify-cli');
    console.log('   netlify login');
    console.log('   netlify dev\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
