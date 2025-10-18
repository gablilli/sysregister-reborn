# Route Restructure to Fix Authentication Redirect Loop

## Problem

After successful login, users were experiencing an immediate redirect loop:
1. User logs in at `/auth`
2. Server sets authentication cookies
3. Client redirects to `/` (dashboard)
4. Middleware checks cookies - but they aren't available yet
5. Middleware redirects back to `/auth`
6. Repeat steps 4-5 infinitely

The root cause was a **timing issue**: cookies set during the login action weren't being sent with the immediate subsequent request to `/`, causing the middleware to think the user was unauthenticated.

## Solution

Restructured the application routes to eliminate the redirect after login:

### Old Route Structure
- Login page: `/auth`
- Dashboard (agenda): `/`
- Other pages: `/files`, `/social`, `/register`, `/profile`, etc.

### New Route Structure  
- Login page: `/` (root)
- Dashboard (agenda): `/app`
- Other pages: `/app/files`, `/app/social`, `/app/register`, `/app/profile`, etc.

### Why This Works

1. **No immediate redirect needed**: When user logs in at `/`, they can stay on that page (which shows login form) or the redirect to `/app` happens with cookies already set
2. **Middleware logic is simpler**: 
   - `/app/*` routes require authentication; redirect to `/` if not authenticated
   - `/` route shows login if not authenticated, redirects to `/app` if already authenticated
3. **Cookies are properly available**: The full page reload to `/app` after login ensures cookies are sent with the request

## Changes Made

### 1. File Structure Changes

**Moved auth files:**
```
src/app/(auth)/auth/actions.ts  → src/app/(auth)/actions.ts
src/app/(auth)/auth/layout.tsx  → src/app/(auth)/layout.tsx
src/app/(auth)/auth/page.tsx    → src/app/(auth)/page.tsx
```

**Moved main app files:**
```
src/app/(main)/*  → src/app/(app)/app/*
```

This creates the following URL structure:
- `(auth)` route group → `/` 
- `(app)/app` route group → `/app`

### 2. Middleware Updates (`src/middleware.ts`)

**Before:**
```typescript
if (request.nextUrl.pathname !== '/auth') {
    if (!token || !tokenExpiryDate || tokenExpiryDate <= new Date() || !internal_token) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }
    return NextResponse.next();
} else {
    if (token && tokenExpiryDate && tokenExpiryDate > new Date() && internal_token) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
}
```

**After:**
```typescript
const isAppRoute = request.nextUrl.pathname.startsWith('/app');

if (isAppRoute) {
    // Protect app routes - require authentication
    if (!token || !tokenExpiryDate || tokenExpiryDate <= new Date() || !internal_token) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
} else if (request.nextUrl.pathname === '/') {
    // If user is already authenticated and tries to access login page, redirect to app
    if (token && tokenExpiryDate && tokenExpiryDate > new Date() && internal_token) {
        return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
}

// Allow all other routes
return NextResponse.next();
```

### 3. Auth Actions Updates (`src/app/(auth)/actions.ts`)

Updated redirect destinations:
```typescript
const ALLOWED_REDIRECTS = ["/app", "/app/profile", "/app/register"];
function sanitizeRedirect(redirectTo: string | undefined | null): string {
  if (typeof redirectTo !== 'string') return "/app";
  if (ALLOWED_REDIRECTS.includes(redirectTo)) return redirectTo;
  return "/app";
}
```

### 4. Client-Side Auth Page Updates (`src/app/(auth)/page.tsx`)

Updated default redirect:
```typescript
const safeRedirect = isSafeRedirect(result.redirectTo) ? result.redirectTo : "/app";
```

### 5. Navigation Components Updates

**Navbar (`src/components/Navbar.tsx`):** All links updated to use `/app` prefix:
```typescript
<Link href={"/app"} ...>           // Dashboard
<Link href={"/app/files"} ...>     // Files
<Link href={"/app/social"} ...>    // Social
<Link href={"/app/register"} ...>  // Register
<Link href={"/app/profile"} ...>   // Profile
```

**NotificationSection (`src/components/NotificationSection.tsx`):**
- Updated link: `/notifications` → `/app/notifications`
- Fixed import: `@/app/(main)/actions` → `@/app/(app)/app/actions`

**ServerDataUpdaterService (`src/components/ServerDataUpdaterService.tsx`):**
- Fixed import: `@/app/(main)/actions` → `@/app/(app)/app/actions`

### 6. Internal Link Updates

All internal links in the app pages updated to use `/app` prefix:

- **Social Spotted:** `/profile/${id}` → `/app/profile/${id}`
- **Social Leaderboard:** `/profile/${id}` → `/app/profile/${id}`
- **Register Marks:** `/register/marks/${name}` → `/app/register/marks/${name}`
- **Register Page:** `/register/marks` → `/app/register/marks`
- **Dashboard (Agenda):** `/lessons/${date}` → `/app/lessons/${date}`

### 7. Import Path Updates

Updated all imports that referenced moved files:
```typescript
// Old
import { verifySession } from "@/app/(auth)/auth/actions";

// New  
import { verifySession } from "@/app/(auth)/actions";
```

Files updated:
- `src/app/(app)/app/actions.ts`
- `src/app/(app)/app/profile/actions.ts`
- `src/app/(app)/app/social/actions.ts`
- `src/app/(app)/app/social/spotted/actions.ts`

## Testing

Verified the changes work correctly:
- ✅ Build succeeds: `npm run build`
- ✅ Linting passes: `npm run lint`
- ✅ Route structure correct
- ✅ All imports updated
- ✅ Middleware logic correct
- ✅ Navigation links updated

## Migration Guide for Users

If you're running this application:

1. **Pull the latest changes:**
   ```bash
   git pull
   ```

2. **Rebuild the application:**
   ```bash
   # Modern Docker Compose (recommended)
   docker compose down
   docker compose up -d --build
   
   # Or using legacy docker-compose
   docker-compose down
   docker-compose up -d --build
   ```
   OR for local development:
   ```bash
   npm install
   npm run build
   npm run start
   ```

3. **Access the application:**
   - Old URL: `http://localhost:3000/auth` for login
   - New URL: `http://localhost:3000/` for login
   - After login, you'll be at: `http://localhost:3000/app`

4. **Update any bookmarks:**
   - Login page: `/auth` → `/`
   - Dashboard: `/` → `/app`
   - Files: `/files` → `/app/files`
   - Social: `/social` → `/app/social`
   - Register: `/register` → `/app/register`
   - Profile: `/profile` → `/app/profile`

## Expected Behavior

### Login Flow
1. User visits `/` → sees login page
2. User enters credentials and submits
3. Server validates and sets cookies
4. Client receives success response with `redirectTo: "/app"`
5. Client does `window.location.href = "/app"` (full page reload)
6. Browser requests `/app` with cookies
7. Middleware sees valid cookies, allows access to `/app`
8. User sees dashboard (agenda)

### Authenticated User Flow
1. Authenticated user visits `/`
2. Middleware sees valid cookies
3. Middleware redirects to `/app`
4. User sees dashboard

### Unauthenticated User Flow
1. Unauthenticated user visits `/app` or any `/app/*` route
2. Middleware sees no valid cookies
3. Middleware redirects to `/`
4. User sees login page

## Benefits

1. **No redirect loop**: Eliminates the timing issue with cookies
2. **Clearer structure**: Login is the root, app is a separate section
3. **Better UX**: No flashing between login and dashboard
4. **More maintainable**: Simpler middleware logic
5. **Standard pattern**: Login at root is a common web app pattern

## Impact

This is a **breaking change** for:
- Bookmarked URLs will need to be updated
- Direct links to pages will need `/app` prefix
- Any external integrations that link to specific pages

However, the middleware will redirect unauthenticated users to `/` anyway, so the impact is minimal for end users.
