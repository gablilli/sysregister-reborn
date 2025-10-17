# Fix for RSC Payload Errors and Docker Health Check Issues

## Problem Description

Users were experiencing two related issues when running SysRegister in Docker:

1. **RSC Payload Fetch Errors**: Browser console showed errors like:
   ```
   Failed to fetch RSC payload for http://localhost:3000/profile. 
   Falling back to browser navigation. 
   TypeError: NetworkError when attempting to fetch resource.
   ```
   This affected routes: `/profile`, `/register`, `/social`, `/files`

2. **Unhealthy Container**: Docker reported the container as unhealthy

## Root Causes

### 1. Health Check Redirects
The Docker health check was requesting the root URL (`http://localhost:3000`), which requires authentication. Without proper authentication cookies, the middleware was redirecting the request to `/auth`, causing the health check to fail with a redirect status instead of a 200 OK.

### 2. Middleware Blocking RSC Requests
The middleware matcher pattern was overly specific:
```typescript
'/((?!api|_next/static|_next/image|_next/data|favicon.ico|icons|manifest.*).*)'
```

This pattern was attempting to exclude individual `_next` subdirectories, but Next.js 14 with App Router makes internal requests to various `_next/*` paths for React Server Components (RSC) payloads. The pattern wasn't excluding all necessary paths, causing the middleware to intercept and redirect these internal requests.

## Solution

### 1. Created Dedicated Health Check Endpoint

Added a new API endpoint at `/api/health` that returns a simple JSON response without requiring authentication:

**File**: `src/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
```

This endpoint is automatically excluded from middleware authentication checks because it's under `/api`.

### 2. Updated Docker Health Check

Modified `docker-compose.yml` to use the new health endpoint:

**Before**:
```yaml
test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
```

**After**:
```yaml
test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
```

### 3. Simplified Middleware Matcher

Updated the middleware matcher to exclude the entire `_next` directory instead of individual subdirectories:

**Before**:
```typescript
matcher: [
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|icons|manifest.*).*)',
]
```

**After**:
```typescript
matcher: [
    '/((?!api|_next|favicon.ico|icons|manifest).*)',
]
```

This ensures that all Next.js internal requests (including RSC payload fetches) are excluded from authentication middleware.

## Files Changed

1. **src/app/api/health/route.ts** (new) - Health check endpoint
2. **docker-compose.yml** - Updated health check to use `/api/health`
3. **src/middleware.ts** - Simplified matcher pattern to exclude all `_next` routes

## What Users Need to Do

Users experiencing these issues need to:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. The health check should now pass and RSC payload errors should be resolved

## Verification

To verify the fix is working:

1. **Check container health**:
   ```bash
   docker ps
   # Should show "healthy" in the STATUS column
   ```

2. **Test health endpoint directly**:
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

3. **Check browser console**: Navigate between pages in the app - there should be no more RSC payload errors

## Technical Details

### Why the Pattern Change Works

Next.js 14 with App Router uses RSC (React Server Components) to enable server-side rendering with client-side navigation. When you navigate between pages client-side, Next.js makes fetch requests to get the RSC payload for the new route.

These requests go to paths like:
- `/_next/data/...`
- `/_next/static/...`
- Other `/_next/*` paths

The old pattern `_next/static|_next/image|_next/data` only excluded these specific subdirectories. If Next.js used any other `_next` path, the middleware would intercept it, check for authentication, and redirect to `/auth`, causing the "NetworkError when attempting to fetch resource" error.

The new pattern `_next` excludes the entire `_next` directory, ensuring all Next.js internal requests work correctly.

### Why a Dedicated Health Endpoint is Better

Previously, the health check requested the root URL, which:
1. Required authentication
2. Could return redirects (302/307 status codes)
3. Made the health check dependent on auth state
4. Caused false negatives even when the server was healthy

The dedicated `/api/health` endpoint:
1. Returns a consistent 200 OK status
2. Requires no authentication
3. Is fast and lightweight
4. Clearly indicates server health
5. Follows best practices for containerized applications

## Related Issues

This fix addresses:
- RSC payload fetch failures during client-side navigation
- Docker container reporting as unhealthy
- NetworkError exceptions in browser console
- Unnecessary fallbacks to full browser navigation
