# Database Initialization Fix for Docker Deployment

## Problem
When running the application in Docker, authentication was failing with the error:
```
The table `main.User` does not exist in the current database.
```

The ClasseViva API call was working correctly and returning valid tokens, but the application couldn't save user data because the database tables hadn't been created.

## Root Cause
The Docker container was starting without initializing the Prisma database schema. The Dockerfile was:
1. Generating the Prisma client during build (`npx prisma generate`)
2. But not creating the actual database tables at runtime

When the app tried to execute `db.user.upsert()`, it failed because the User table didn't exist.

## Solution
Added automatic database initialization at container startup:

### 1. Created `docker-entrypoint.sh`
A startup script that:
- Runs `prisma db push` to create/sync database tables
- Then starts the Next.js server
- Uses the Prisma CLI directly via Node.js to avoid dependency on npx

### 2. Updated `Dockerfile`
- Copies Prisma CLI dependencies to the runner stage
- Copies and makes the entrypoint script executable
- Sets correct permissions for database and node_modules directories
- Uses the entrypoint script as the container CMD

### 3. Fixed Volume Mount Issue
The original docker-compose.yml mounted `./data:/app/prisma`, which replaced the entire prisma directory including the `schema.prisma` file. This was fixed by:
- Mounting to `/app/data` instead of `/app/prisma`
- Updating `DATABASE_URL` to point to `/app/data/database.db`
- Keeping `schema.prisma` accessible at `/app/prisma/schema.prisma`

### 4. Updated `docker-compose.yml`
- Changed database path from `/app/prisma/database.db` to `/app/data/database.db`
- Updated volume mount from `./data:/app/prisma` to `./data:/app/data`

## Files Changed
1. **docker-entrypoint.sh** (new) - Startup script with database initialization
2. **Dockerfile** - Added Prisma CLI dependencies and entrypoint
3. **docker-compose.yml** - Fixed database path and volume mount
4. **DOCKER_SETUP.md** - Updated documentation
5. **.env.example** - Added Docker database path comment

## Testing
Verified that:
- ✅ Docker image builds successfully
- ✅ Container starts and runs database initialization
- ✅ All database tables are created (User, Post, PostLikeInteraction, etc.)
- ✅ Database file is persisted in the mounted volume
- ✅ Server starts successfully after initialization

## What Users Need to Do
Users who have already deployed need to:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. The database will be automatically initialized on first startup

## No Data Loss
If users already have a `./data` directory with existing database files:
- The data is safe because we're just changing the mount point
- The startup script will update the schema if needed
- Existing data will be preserved
