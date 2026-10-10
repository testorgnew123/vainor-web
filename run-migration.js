#!/usr/bin/env node

/**
 * Run database migrations for fixing custom auth schema
 * This script applies the migration to fix addresses and other tables
 * to work with custom JWT authentication instead of Supabase auth.users
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260214000001_migrate_to_custom_auth_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: 20260214000001_migrate_to_custom_auth_schema.sql');
    console.log('   This will fix the addresses table and other tables to work with custom auth\n');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 The following tables have been recreated:');
    console.log('   - addresses (now references public.users)');
    console.log('   - orders (now supports both registered and guest users)');
    console.log('   - order_items');
    console.log('   - carts');
    console.log('   - cart_items');
    console.log('   - wishlists');
    console.log('   - wishlist_items\n');

    // Verify the addresses table exists
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'addresses'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Addresses table verified and ready to use');
    } else {
      console.log('⚠️  Warning: Addresses table not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();
