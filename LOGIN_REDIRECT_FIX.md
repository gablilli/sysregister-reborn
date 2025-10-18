# Login Redirect Loop Fix

## Issue Fixed
Users were experiencing an infinite redirect loop after logging in, where they would be continuously redirected between the login page (`/auth`) and the home page (`/`), making the application unusable.

## Root Cause
The problem was caused by a **race condition** between:
1. Setting authentication cookies on the server
2. Performing client-side navigation to redirect the user

### What Was Happening
1. User submits login credentials
2. Server action `getUserSession` successfully authenticates and sets cookies
3. Client-side code executes `router.push("/")` to redirect
4. **Race condition**: Middleware checks cookies before they fully propagate
5. Middleware sees missing/invalid cookies and redirects to `/auth`
6. Since cookies are actually set, middleware on `/auth` redirects back to `/`
7. Loop continues indefinitely

## Solution
Replaced **client-side navigation** with **server-side redirect**:

### Before (Client-Side)
```typescript
const result = await getUserSession({ uid, pass });
if (result.success) {
  router.push("/");  // Client-side navigation - problematic!
}
```

### After (Server-Side)
```typescript
await loginAndRedirect({ uid, pass, redirectTo: goTo });
// Server performs HTTP redirect with cookies already set
```

## How It Works Now

1. **User submits login form**
   - Credentials sent to `loginAndRedirect` server action

2. **Server authenticates and sets cookies**
   - Validates credentials with ClasseViva API
   - Creates/updates user in database
   - Sets three secure cookies:
     - `token` - ClasseViva API token
     - `tokenExpiry` - Token expiration date
     - `internal_token` - Internal JWT for user identification

3. **Server performs redirect**
   - Uses Next.js `redirect()` function
   - Performs HTTP redirect (302/303 status)
   - Browser makes a NEW HTTP request with cookies included

4. **Middleware validates cookies**
   - Sees valid cookies in the new request
   - Allows access to protected pages
   - No race condition possible

## Technical Improvements

### 1. Secure Cookie Options
All cookies now use proper security settings:
```typescript
{
  httpOnly: true,        // Prevents JavaScript access (XSS protection)
  secure: true,          // HTTPS only in production
  sameSite: "lax",       // CSRF protection
  path: "/",             // Available across entire site
  maxAge: 60 * 60 * 2    // 2-hour expiration
}
```

### 2. Proper Error Handling
Added `isNextRedirect` helper to distinguish between:
- Expected redirect throws (successful login)
- Actual errors (network issues, invalid credentials)

```typescript
function isNextRedirect(error: unknown): boolean {
  return error instanceof Error && error.message?.includes("NEXT_REDIRECT");
}
```

### 3. Better Code Organization
- `setAuthCookies` - Centralized cookie setting logic
- `loginAndRedirect` - Complete login flow with redirect
- `getUserSession` - Maintained for backward compatibility

## Files Modified

### `src/app/(auth)/auth/actions.ts`
- Added `loginAndRedirect` server action (159 lines)
- Added `setAuthCookies` helper function
- Improved cookie security with httpOnly, secure, sameSite, maxAge
- Added comprehensive JSDoc documentation

### `src/app/(auth)/auth/page.tsx`
- Replaced `router.push()` with `loginAndRedirect`
- Added `isNextRedirect` helper function
- Removed `useRouter` hook dependency
- Simplified auto-login flow

## Benefits

1. ✅ **No More Redirect Loops** - Server-side redirect eliminates race conditions
2. ✅ **Better Security** - Improved cookie options (httpOnly, secure, sameSite)
3. ✅ **Proper Cookie Expiration** - maxAge matches JWT expiration
4. ✅ **Cleaner Code** - Removed client-side navigation complexity
5. ✅ **Better Error Handling** - Distinguishes redirects from errors
6. ✅ **Documentation** - JSDoc comments for maintainability

## Testing

After deployment, verify:
- [ ] Manual login works without redirect loop
- [ ] Auto-login (saved credentials) works correctly
- [ ] Login with `goto` parameter redirects correctly
- [ ] Invalid credentials show error message
- [ ] Cookies are set with proper security flags
- [ ] Token expiration is handled correctly

## Migration Notes

**No user action required!** This is a backward-compatible fix:
- Existing user sessions remain valid
- No database changes required
- No configuration changes needed
- Works with existing middleware and authentication flow

## Related Files

- **Middleware**: `src/middleware.ts` - Validates cookies on each request
- **Auth Actions**: `src/app/(auth)/auth/actions.ts` - Login logic
- **Auth Page**: `src/app/(auth)/auth/page.tsx` - Login UI

## Future Improvements

Potential enhancements for consideration:
- Add token refresh mechanism before expiration
- Implement remember-me functionality with longer cookie expiration
- Add rate limiting for login attempts
- Consider using session storage for tokens instead of cookies
