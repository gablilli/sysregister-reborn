#!/bin/sh
set -e

echo "Starting SysRegister application..."

# Initialize database schema if it doesn't exist
echo "Initializing database schema..."

# Use Prisma CLI - path determined from package.json bin entry
# In standalone mode, we don't have npx, so we call the binary directly
PRISMA_BIN="node_modules/prisma/build/index.js"

if [ ! -f "$PRISMA_BIN" ]; then
    echo "Error: Prisma CLI not found at $PRISMA_BIN"
    exit 1
fi

node "$PRISMA_BIN" db push --skip-generate --schema=/app/prisma/schema.prisma

echo "Database schema initialized successfully"

# Start the Next.js application
echo "Starting Next.js server..."
exec node server.js
