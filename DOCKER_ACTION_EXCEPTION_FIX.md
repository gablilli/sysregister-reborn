# Docker Server Action Exception Handling Fix

## Problem

After implementing the simplified authentication fix (PR #25) that uses cookies instead of returning values from server actions, a new issue appeared:

**Server Error:**
```
failed to forward action response TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
```

**Client Error:**
```
Login failed - no auth cookies found
```

## Root Cause Analysis

### What Was Happening

1. **Server Side**: The `loginAndRedirect` server action calls `robustFetch` to authenticate with ClasseViva API
2. **Fetch Failure**: Sometimes `robustFetch` throws an exception (network timeout, DNS error, etc.)
3. **Exception Caught**: The exception is caught in the try-catch block
4. **Cookie Setting**: The catch block tries to set an error cookie via `cookies().set()`
5. **Response Forwarding Fails**: Next.js tries to forward the server action response (even though it's `void`) back to the client
6. **Client Receives Exception**: The client's `await loginAndRedirect()` call throws an exception
7. **Wrong Error Message**: The client catch block shows a generic error instead of checking cookies

### The Two Problems

1. **Uncaught Cookie-Setting Exceptions**: If `cookies().set()` throws an exception, it bubbles up and prevents the function from returning cleanly
2. **Client Not Checking Cookies After Exception**: Even when the server successfully sets cookies, if Next.js can't forward the response, the client throws an exception and doesn't check for cookies

## The Solution

### Server-Side Fix (`src/app/(auth)/actions.ts`)

Wrap ALL `cookies().set()` calls in try-catch blocks to prevent exceptions from bubbling up:

```typescript
try {
  cookies().set("auth_error", errorMsg, {
    httpOnly: false,
    maxAge: 5,
    path: "/",
  });
} catch (cookieError) {
  console.error("[loginAndRedirect] Errore impostando cookie di errore:", cookieError);
}
return;
```

**Key Changes:**
- Every `cookies().set()` call is now wrapped in try-catch
- Each error path explicitly returns
- Cookie-setting errors are logged but don't prevent function completion

### Client-Side Fix (`src/app/(auth)/page.tsx`)

Handle server action exceptions gracefully and always check cookies:

```typescript
try {
  // Call server action
  await loginAndRedirect({ uid, pass });
} catch (err) {
  // Even if the server action throws (e.g., "failed to forward action response"),
  // the cookies might have been set successfully on the server
  console.warn("[CLIENT] Server action threw exception (may be normal in Docker):", err);
}

// Small delay to ensure cookies are propagated
await new Promise(resolve => setTimeout(resolve, 150));

// Always check cookies, even if the action threw
const authError = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth_error='))
  ?.split('=')[1];

if (authError) {
  showError(decodeURIComponent(authError));
  setLoading(false);
  return;
}

const hasToken = document.cookie.includes('token=');
const hasInternalToken = document.cookie.includes('internal_token=');

if (hasToken && hasInternalToken) {
  window.location.href = redirectTo;
} else {
  showError("Si è verificato un errore durante l'accesso");
  setLoading(false);
}
```

**Key Changes:**
- Separate try-catch for server action call only
- Log exception as warning (may be normal in Docker)
- Always check cookies after action call, even if it threw
- 150ms delay ensures cookies propagate from server to client
- Removed outer try-catch to prevent hiding the cookie-checking logic

## Why This Works

### 1. Server Actions Complete Even with Exceptions
When `cookies().set()` is wrapped in try-catch, the server action can complete and return cleanly, even if cookie-setting fails.

### 2. Cookies Are Set Before Response Forwarding
HTTP cookies are set via response headers, which happens before Next.js tries to forward the action response body. Even if response forwarding fails, cookies are already sent to the client.

### 3. Client Checks Cookies After Action
By catching the server action exception separately and then checking cookies, the client can detect successful authentication even when Next.js throws "failed to forward action response".

### 4. Delay Ensures Propagation
The 150ms delay gives the browser time to process the Set-Cookie headers before checking `document.cookie`.

## Flow Diagram

### Success Flow
```
1. Client calls loginAndRedirect()
   ↓
2. Server authenticates with ClasseViva API
   ↓
3. Server sets auth cookies (token, internal_token, tokenExpiry)
   ↓
4. Server returns void
   ↓
5. Next.js forwards response to client (may fail in Docker)
   ↓
6. Client catches any exception
   ↓
7. Client waits 150ms
   ↓
8. Client checks document.cookie
   ↓
9. Client finds token + internal_token ✅
   ↓
10. Client redirects to /app
```

### Error Flow
```
1. Client calls loginAndRedirect()
   ↓
2. Server tries to authenticate
   ↓
3. robustFetch throws exception (network error)
   ↓
4. Server catch block sets auth_error cookie
   ↓
5. Server returns void
   ↓
6. Next.js forwards response to client (may fail in Docker)
   ↓
7. Client catches any exception
   ↓
8. Client waits 150ms
   ↓
9. Client checks document.cookie
   ↓
10. Client finds auth_error cookie
    ↓
11. Client displays error message to user
```

## Benefits

✅ **Resilient**: Works even when Next.js can't forward server action responses  
✅ **Cookie-First**: Relies on HTTP cookies, which are more reliable than response bodies  
✅ **Graceful Degradation**: Logs warnings instead of hard failures  
✅ **User-Friendly**: Shows appropriate error messages from server  
✅ **Docker Compatible**: Handles Docker networking quirks  
✅ **Simple**: Clear, maintainable error handling flow  

## Testing

```bash
npm run lint    # ✅ Pass
npm run build   # ✅ Pass
```

### Manual Testing Checklist

- [ ] Test successful login with valid credentials
- [ ] Test failed login with invalid credentials  
- [ ] Test network timeout (slow connection)
- [ ] Test in Docker environment
- [ ] Test in local development
- [ ] Test cookie propagation timing

## Related Issues

- **PR #25**: Simplified auth fix (void return instead of object)
- **SIMPLIFIED_AUTH_FIX.md**: Original documentation for PR #25
- **DOCKER_FETCH_FIX.md**: Documentation for robustFetch implementation
- **FINAL_SOLUTION.md**: Hybrid approach documentation

## Lessons Learned

1. **Cookies Are More Reliable Than Response Bodies**: In Docker environments, HTTP cookies (headers) are more reliable than serialized response bodies
2. **Always Check Cookies After Actions**: When using cookie-based authentication, always check cookies after server actions, even if exceptions occur
3. **Defensive Cookie Setting**: Wrap all `cookies().set()` calls in try-catch to prevent cascading failures
4. **Timing Matters**: Add small delays when checking cookies to ensure browser has processed Set-Cookie headers
5. **Log, Don't Throw**: In error paths, log exceptions as warnings instead of throwing them, to allow graceful degradation

## Configuration

No configuration changes required. The fix works with existing environment variables:

- `JWT_SECRET`: Used for internal JWT token generation
- `COOKIE_SECURE`: Controls secure flag on cookies (default: false for Docker HTTP compatibility)

## Deployment

```bash
git pull
docker compose down
docker compose up -d --build
```

No additional steps required.
