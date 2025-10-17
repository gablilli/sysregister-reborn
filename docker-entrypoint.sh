#!/bin/sh
set -e

echo "Starting SysRegister application..."

# Initialize database schema if it doesn't exist
echo "Initializing database schema..."
npx prisma db push --skip-generate

echo "Database schema initialized successfully"

# Start the Next.js application
echo "Starting Next.js server..."
exec node server.js
