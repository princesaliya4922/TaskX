#!/bin/bash

# SprintX Database Setup Script
# This script sets up the database for development

set -e

echo "🚀 SprintX Database Setup"
echo "========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please copy .env.example to .env.local and configure your database URL"
    exit 1
fi

# Load environment variables
source .env.local

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "🗄️  Pushing schema to database..."
npx prisma db push

# Seed the database
echo "🌱 Seeding database with demo data..."
npm run db:seed

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📊 You can now:"
echo "  • View data with Prisma Studio: npm run db:studio"
echo "  • Test the API: curl http://localhost:3000/api/health"
echo "  • Start development: npm run dev"
echo ""
echo "🔐 Demo login credentials:"
echo "  Admin: john@example.com / password123"
echo "  Member: jane@example.com / password123"
echo "  Member: mike@example.com / password123"
