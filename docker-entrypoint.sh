#!/bin/sh
set -e

echo "Starting SysRegister application..."

# Initialize database schema if it doesn't exist
echo "Initializing database schema..."
node node_modules/prisma/build/index.js db push --skip-generate --schema=/app/prisma/schema.prisma

echo "Database schema initialized successfully"

# Start the Next.js application
echo "Starting Next.js server..."
exec node server.js
