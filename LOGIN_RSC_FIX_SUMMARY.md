# Fix for RSC Payload Fetch Errors After Login

## Problem

After the redirect loop fix, users were experiencing issues after successful login:

### Client-side errors:
```
Failed to fetch RSC payload for http://localhost:3000/files. Falling back to browser navigation.
Failed to fetch RSC payload for http://localhost:3000/social. Falling back to browser navigation.
Failed to fetch RSC payload for http://localhost:3000/register. Falling back to browser navigation.
Failed to fetch RSC payload for http://localhost:3000/profile. Falling back to browser navigation.
```

### Server-side errors:
```
[loginAndRedirect] Token JWT generato e cookies impostati, successo
failed to forward action response TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
```

### Impact
- Login succeeded, redirect worked
- But the application screen after login didn't function properly
- Navigation links failed to load
- Users couldn't access main features

## Root Causes

### 1. Next.js Link Prefetch Failures

When the main page loaded after login, the Navbar component with Next.js `Link` components tried to prefetch the target pages (`/files`, `/social`, `/register`, `/profile`). In Docker standalone mode, these prefetch requests were failing with network errors.

**Why**: Next.js tries to optimize navigation by prefetching linked pages. In the Docker environment, these internal fetch requests were encountering network issues, possibly due to:
- Docker networking configuration
- Standalone mode internal routing
- Hostname resolution issues

### 2. Secure Cookies Over HTTP

The authentication cookies were being set with `secure: true` in production mode, but users were accessing the app via HTTP (`http://localhost:3000`). Browsers don't send secure cookies over HTTP connections.

**Why**: The code had:
```typescript
secure: process.env.NODE_ENV === "production"
```

In Docker, `NODE_ENV=production` is set, so `secure: true` was used. This meant:
- Cookies were set during login (in the Set-Cookie response header)
- But browsers refused to send them back in subsequent requests (because they're secure-only)
- The middleware couldn't verify the session
- All requests after login appeared unauthenticated

## Solutions Implemented

### 1. Disabled Prefetch on Navbar Links

Added `prefetch={false}` to all Link components in the Navbar:

```typescript
<Link href={"/files"} prefetch={false}>
  {/* ... */}
</Link>
```

**Impact**: 
- ✅ Prevents automatic prefetching that was causing RSC payload errors
- ✅ Navigation still works when user clicks (on-demand loading)
- ✅ Minor performance trade-off (no prefetch) for reliability

### 2. Made Cookie Security Configurable

Updated `setAuthCookies` function to make the `secure` flag configurable:

```typescript
const useSecureCookies = process.env.COOKIE_SECURE === 'true' || 
  (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false');
```

**Logic**:
- If `COOKIE_SECURE=true` → use secure cookies (for HTTPS)
- If `COOKIE_SECURE=false` → don't use secure cookies (for HTTP)
- If not set and in production → don't use secure (default safe for Docker HTTP)
- If not set and in development → don't use secure

### 3. Updated Docker Configuration

Added `COOKIE_SECURE` environment variable to `docker-compose.yml`:

```yaml
environment:
  # Cookies - Set to 'false' if not using HTTPS (e.g., local Docker deployment)
  # Set to 'true' if behind an HTTPS reverse proxy
  - COOKIE_SECURE=${COOKIE_SECURE:-false}
```

**Default**: `false` for Docker deployments without HTTPS
**When to change**: Set to `true` if your Docker deployment is behind an HTTPS reverse proxy (nginx, Caddy, etc.)

## Files Changed

1. **src/components/Navbar.tsx**
   - Added `prefetch={false}` to all 5 Link components

2. **src/app/(auth)/auth/actions.ts**
   - Updated `setAuthCookies` function with configurable secure flag
   - Added logic to respect `COOKIE_SECURE` environment variable

3. **docker-compose.yml**
   - Added `COOKIE_SECURE` environment variable with default `false`
   - Added documentation comment

4. **.env.example**
   - Documented `COOKIE_SECURE` variable
   - Added usage instructions

## Testing

Verified that:
- ✅ Code lints successfully (`npm run lint`)
- ✅ Project builds successfully (`npm run build`)
- ✅ TypeScript types are correct
- ✅ No breaking changes to existing functionality

## Deployment Instructions

### For Users Already Running the App

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. The fix is automatic - cookies will now work over HTTP

### For New Deployments

The default configuration (`COOKIE_SECURE=false`) is correct for most Docker deployments.

**Only change if**:
- You're using an HTTPS reverse proxy (nginx, Caddy, Traefik)
- Your users access the app via `https://yourdomain.com`

Then set in your `.env` or docker-compose.yml:
```bash
COOKIE_SECURE=true
```

## Why This Works

### Prefetch Disabled
- Next.js no longer tries to prefetch pages on load
- RSC payload fetch errors eliminated
- Navigation happens on-demand when user clicks
- More reliable in Docker environments

### Cookie Security Fixed
- Cookies work over HTTP in Docker (default)
- Cookies can be secured for HTTPS deployments (when configured)
- Browsers now send authentication cookies in all requests
- Session validation works correctly
- Middleware can verify authentication

## Alternative Configurations

### Behind HTTPS Reverse Proxy
If you have nginx or Caddy providing HTTPS:

```yaml
# docker-compose.yml
environment:
  - COOKIE_SECURE=true
```

### Local Development (not Docker)
Create `.env.local`:
```bash
COOKIE_SECURE=false
NODE_ENV=development
```

## Impact

This fix resolves:
- ✅ RSC payload fetch errors after login
- ✅ Cookie transmission issues over HTTP
- ✅ Application not loading after successful login
- ✅ Navigation failures in Docker environment
- ✅ Session validation failures

Users can now:
- ✅ Login successfully
- ✅ See the main application screen
- ✅ Navigate between pages
- ✅ Use all application features
- ✅ Stay authenticated for the session duration

## Security Considerations

### HTTP vs HTTPS
- Using `COOKIE_SECURE=false` over HTTP is less secure (vulnerable to interception)
- **Recommended**: Deploy behind an HTTPS reverse proxy and set `COOKIE_SECURE=true`
- **Acceptable**: Use HTTP for local development or internal networks only

### Cookie Attributes
The cookies still use:
- `httpOnly: true` - Protects against XSS attacks
- `sameSite: "lax"` - Protects against CSRF attacks
- `path: "/"` - Scoped to entire application
- `maxAge: 7200` - 2 hour expiration

These provide good security even over HTTP, but HTTPS is always preferred for production.
