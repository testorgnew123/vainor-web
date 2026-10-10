#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function verifyDatabase() {
  console.log('🔍 Verifying Neon Database Setup');
  console.log('==================================\n');

  // Read DATABASE_URL from .env file
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const databaseUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

  if (!databaseUrlMatch) {
    console.error('❌ Error: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const databaseUrl = databaseUrlMatch[1].trim();

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check coupons
    const couponsResult = await client.query(
      'SELECT code, description, discount_type, discount_value FROM coupons ORDER BY code;'
    );

    console.log('\n🎟️  Sample coupons:');
    couponsResult.rows.forEach(coupon => {
      console.log(`  ✓ ${coupon.code}: ${coupon.description} (${coupon.discount_type} ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ''})`);
    });

    console.log('\n✅ Database is ready!\n');
    console.log('Next step: Test locally with Netlify Dev');
    console.log('  npm install');
    console.log('  netlify dev\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDatabase();
