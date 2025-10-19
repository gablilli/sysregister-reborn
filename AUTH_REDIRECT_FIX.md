# Authentication Redirect Loop Fix

## Problem Summary

Despite the restructuring done in [PR #21](https://github.com/gablilli/sysregister-reborn/pull/21), the authentication redirect loop issue persisted. Users reported that after logging in:
1. Credentials are validated successfully
2. Cookies are set on the server
3. Client-side redirect to `/app` occurs
4. User briefly sees the dashboard
5. **Immediately gets redirected back to `/` (login page)**
6. Loop continues indefinitely

## Root Cause Analysis

### Issue 1: Cookie Timing Race Condition

The fundamental problem was using **client-side navigation after server-side cookie setting**:

```typescript
// OLD CODE (problematic) - BEFORE THIS FIX
await setAuthCookies(token, expire, tokenJwt);
return { success: true, redirectTo: "/app" };

// Client then does:
window.location.href = "/app"; 
```

**Why this fails:**
1. Server action sets cookies and returns
2. Client receives response with `Set-Cookie` headers
3. Client immediately calls `window.location.href = "/app"`
4. **Browser makes new request to `/app` but cookies might not be included yet**
5. Middleware sees no cookies → redirects to `/`
6. Redirect loop begins

This is a **browser timing issue** where the `Set-Cookie` headers are received but the cookies aren't guaranteed to be sent with the very next request made via `window.location.href`.

### Issue 2: Non-functional Auto-Login

The code had an auto-login feature that tried to read credentials from localStorage. **This is the OLD CODE that has been removed:**

```typescript
// OLD CODE (broken) - THIS WAS REMOVED
const pass = localStorage.getItem("password"); // ← Never stored!

// Earlier in code:
localStorage.setItem("username", uid);
// Password is sensitive; do not store in localStorage ← Comment says it all
```

This auto-login could never work since the password was deliberately not stored, adding unnecessary complexity. **This entire feature has been removed in this fix.**

## Solution

### Fix 1: Server-Side Redirect

Replace client-side navigation with **Next.js server-side redirect**:

```typescript
// NEW CODE (correct) - AFTER THIS FIX
import { redirect } from "next/navigation";

await setAuthCookies(token, expire, tokenJwt);
redirect(sanitizeRedirect(redirectTo)); // ← Server-side redirect
```

**Why this works:**
1. Cookies are set via `cookies().set()`
2. `redirect()` throws a special Next.js error
3. Next.js catches this error and performs the redirect **at the server level**
4. The redirect response includes the cookies AND the redirect location
5. Browser's next request to `/app` **includes the cookies automatically**
6. Middleware sees valid cookies → allows access to `/app`
7. ✅ No redirect loop!

### Fix 2: Handle Next.js Redirect Exceptions

Since Next.js `redirect()` works by throwing an exception, we need to handle it properly:

```typescript
try {
  // ... authentication logic ...
  redirect(sanitizeRedirect(redirectTo));
} catch (error) {
  // Check if this is a Next.js redirect (which is expected)
  if (error && typeof error === 'object' && 'digest' in error) {
    const errorWithDigest = error as { digest: unknown };
    if (typeof errorWithDigest.digest === 'string' && 
        errorWithDigest.digest.startsWith('NEXT_REDIRECT')) {
      // This is an expected redirect, re-throw it
      throw error;
    }
  }
  // Handle actual errors
  return { error: "Errore durante l'autenticazione. Riprova più tardi." };
}
```

On the client side:

```typescript
try {
  const result = await loginAndRedirect({ uid, pass, redirectTo: goTo });
  // If we get here, login failed (successful login redirects and doesn't return)
  if (result?.error) {
    showError(result.error);
  }
} catch (err) {
  // Check if this is a Next.js redirect (which is expected on success)
  if (err && typeof err === 'object' && 'digest' in err) {
    const errorWithDigest = err as { digest: unknown };
    if (typeof errorWithDigest.digest === 'string' && 
        errorWithDigest.digest.startsWith('NEXT_REDIRECT')) {
      // Let it propagate - this will trigger the redirect
      throw err;
    }
  }
  // Handle actual errors
  showError("Si è verificato un errore durante l'accesso");
}
```

### Fix 3: Remove Broken Auto-Login

Removed the entire auto-login functionality since:
- Password was never stored in localStorage (for security reasons)
- The feature could never work as implemented
- It added unnecessary complexity and potential confusion

## Technical Details

### Why Server-Side Redirect is Superior

1. **Atomic Operation**: Cookies are set and redirect happens in the same response
2. **Browser Guarantees**: Browser always sends cookies with the redirected request
3. **No Race Condition**: No timing window for cookies to be "not quite set yet"
4. **Next.js Best Practice**: Uses framework's native capabilities

### Cookie Configuration

The cookies use secure settings:
```typescript
{
  httpOnly: true,    // Cannot be accessed by JavaScript
  secure: useSecureCookies,  // HTTPS only (when enabled)
  sameSite: "lax",   // Prevents CSRF attacks
  path: "/",         // Available to all routes
  maxAge: 60 * 60 * 2  // 2 hours
}
```

With server-side redirect, `sameSite: "lax"` works correctly because the redirect is a same-site navigation initiated by the server, not by client-side JavaScript.

## Changes Made

### Modified Files

1. **`src/app/(auth)/actions.ts`**
   - Added `import { redirect } from "next/navigation"`
   - Changed `loginAndRedirect` to use server-side `redirect()` instead of returning redirect URL
   - Added proper error handling for Next.js redirect exceptions
   - Updated JSDoc comments to reflect new behavior

2. **`src/app/(auth)/page.tsx`**
   - Removed `useEffect` import (no longer needed)
   - Removed `isSafeRedirect` function (validation now in server action)
   - Removed entire `tryAutoSignIn` function and its `useEffect` hook
   - Updated `trySignIn` to handle the new server-side redirect behavior
   - Added proper error handling for Next.js redirect exceptions

### Lines Changed
- **66 lines removed** (mostly auto-login code)
- **26 lines added** (server-side redirect and proper error handling)
- **Net change: -40 lines** (simpler, more maintainable code)

## Testing

1. ✅ Build passes: `npm run build`
2. ✅ Linting passes: `npm run lint`
3. ✅ No TypeScript errors
4. ✅ All 17 pages generated successfully

## Expected Behavior After Fix

### Successful Login Flow
1. User enters credentials at `/`
2. Server validates credentials
3. Server sets authentication cookies
4. **Server performs redirect to `/app`**
5. Browser follows redirect with cookies
6. Middleware sees valid cookies
7. User sees `/app` dashboard
8. ✅ No redirect loop!

### Failed Login Flow
1. User enters invalid credentials at `/`
2. Server validation fails
3. Error message returned to client
4. User stays at `/` with error displayed
5. No redirect occurs

### Authenticated User at `/`
1. User with valid cookies visits `/`
2. Middleware sees valid cookies
3. Middleware redirects to `/app`
4. User sees dashboard immediately

## Why Previous Attempts Failed

PR #21 restructured the routes (moving `/auth` to `/` and `/` to `/app`) but didn't address the fundamental cookie timing issue. The problem wasn't the route structure - it was the **client-side redirect after server-side cookie setting**.

## Comparison: Client-Side vs Server-Side Redirect

### Client-Side (OLD - Problematic)
```
[Server Action]
  1. Set cookies in response headers
  2. Return { success: true, redirectTo: "/app" }
  
[Client Code]
  3. Receive response
  4. window.location.href = "/app"
  
[Browser]
  5. Make new request to /app
  6. ⚠️ Cookies might not be included yet
  
[Middleware]
  7. No cookies found → redirect to /
  8. 🔄 LOOP!
```

### Server-Side (NEW - Fixed)
```
[Server Action]
  1. Set cookies
  2. Call redirect("/app")
  
[Next.js]
  3. Generate redirect response with cookies
  
[Browser]
  4. Receive redirect response
  5. Follow redirect to /app
  6. ✅ Cookies automatically included
  
[Middleware]
  7. Valid cookies found → allow access
  8. ✅ Success!
```

## Security Considerations

- Cookies remain `httpOnly` (cannot be accessed by JavaScript)
- Redirects are still validated against allowlist
- No sensitive data stored in localStorage
- Server-side validation ensures cookies are genuine before redirect
- All security measures from PR #21 are maintained

## Conclusion

The fix addresses the core issue by eliminating the race condition between cookie setting and navigation. By using Next.js's native server-side redirect functionality, we ensure cookies are always included in the redirected request, preventing the redirect loop entirely.

This is a **minimal, surgical change** that:
- Fixes the root cause
- Simplifies the codebase
- Uses framework best practices
- Maintains all security measures
- Results in more maintainable code
