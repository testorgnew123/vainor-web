#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDatabase() {
  console.log('🚀 Adding users table to Neon Database');
  console.log('======================================\n');

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

  // Connect to database
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📡 Connecting to Neon database...\n');
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if users table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✓ Users table already exists, skipping creation.\n');
    } else {
      console.log('📝 Creating users table...\n');

      await client.query(`
        -- Create users table for custom authentication
        CREATE TABLE public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX idx_users_email ON public.users(email);

        -- Add update trigger
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON public.users
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
      `);

      console.log('✓ Users table created successfully!\n');
    }

    // Verify by checking tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('✅ Migration complete!\n');
    console.log('Tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n🎉 Your database is ready for custom JWT authentication.\n');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateDatabase();
