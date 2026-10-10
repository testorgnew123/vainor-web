#!/bin/bash

# Setup script for Neon Database
# This script will create the database schema in your Neon database

set -e  # Exit on error

echo "🚀 Setting up Neon Database for Atelier E-commerce"
echo "=================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it by running:"
  echo "  export DATABASE_URL='your-neon-connection-string'"
  echo ""
  echo "You can find your connection string in the Neon dashboard"
  exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql is not installed"
  echo ""
  echo "Please install PostgreSQL client:"
  echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  macOS: brew install postgresql"
  echo "  Windows: Use WSL or download from postgresql.org"
  exit 1
fi

echo "✓ psql is installed"
echo ""

# Run the schema file
echo "📝 Creating database schema..."
echo ""

psql "$DATABASE_URL" < neon_schema.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify the setup by connecting to your database:"
echo "   psql \"\$DATABASE_URL\""
echo ""
echo "2. Check tables were created:"
echo "   \\dt"
echo ""
echo "3. View sample coupons:"
echo "   SELECT code, description FROM coupons;"
echo ""
echo "4. Start the development server:"
echo "   npm install"
echo "   netlify dev"
echo ""
