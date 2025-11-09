# Login and Redirect Fix

## Problem

The login system was experiencing persistent redirect loops and authentication failures. Users would:
1. Enter valid credentials
2. Submit the login form
3. See a brief redirect to `/app`
4. Get immediately redirected back to the login page `/`

This was caused by a race condition where the client-side code would redirect before the browser had fully stored the authentication cookies.

## Root Causes

### 1. Fixed Delay Was Insufficient
The previous implementation used a fixed 150ms delay:
```typescript
await new Promise(resolve => setTimeout(resolve, 150));
window.location.href = redirectTo;
```

This delay was:
- Too short in some cases (slow networks, busy browsers)
- Too long in others (wasting time)
- Non-deterministic (no guarantee cookies were set)

### 2. HttpOnly Cookies Prevented Verification
All authentication cookies were set with `httpOnly: true`:
```typescript
const cookieOptions = {
  httpOnly: true,
  // ...
};
```

While this is good for security, it meant JavaScript couldn't verify the cookies were set before redirecting. The client code was "flying blind."

### 3. Middleware Race Condition
When `window.location.href` triggered a navigation to `/app`, the middleware would run immediately:
```typescript
if (!token || !tokenExpiryDate || tokenExpiryDate <= new Date() || !internal_token) {
    return NextResponse.redirect(new URL('/', request.url));
}
```

If the cookies weren't fully propagated yet, this check would fail and redirect back to `/`, creating the loop.

## Solution

### 1. Added Client-Readable Auth Status Cookie

Added a new cookie specifically for client-side verification:
```typescript
response.cookies.set("auth_status", "authenticated", {
  httpOnly: false,  // Client-readable
  secure: useSecureCookies,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 2, // 2 hours
});
```

This cookie:
- Acts as a signal that authentication succeeded
- Can be read by JavaScript
- Doesn't expose sensitive data (just "authenticated" status)

### 2. Implemented Polling Mechanism

Instead of a fixed delay, the client now polls for the cookie:
```typescript
const checkCookiesAndRedirect = () => {
  attempts++;
  const hasAuthStatus = document.cookie.includes('auth_status=authenticated');
  
  if (hasAuthStatus) {
    // Cookies are set, safe to redirect
    window.location.href = redirectTo;
  } else if (attempts < maxAttempts) {
    // Try again in 100ms
    setTimeout(checkCookiesAndRedirect, 100);
  } else {
    // Give up after 3 seconds
    showError("Errore nell'impostazione dell'autenticazione. Riprova.");
  }
};

setTimeout(checkCookiesAndRedirect, 50);
```

This approach:
- Waits only as long as necessary
- Has a maximum timeout (3 seconds)
- Provides feedback if something goes wrong
- Is deterministic (waits for actual cookie presence)

### 3. Graceful Error Handling

If cookies aren't set within 3 seconds, the user sees:
```
"Errore nell'impostazione dell'autenticazione. Riprova."
```

Instead of being stuck in a redirect loop, they get actionable feedback.

## Flow Diagram

### Before (Buggy)
```
Login → API call → {success: true} → Wait 150ms → Redirect to /app
                                                        ↓
                                                   Middleware checks cookies
                                                        ↓
                                                   ❌ Not set yet!
                                                        ↓
                                                   Redirect to / (LOOP!)
```

### After (Fixed)
```
Login → API call → {success: true} → Poll for auth_status cookie
                         ↓                       ↓
                    Set cookies             Cookie found? No → Wait 100ms → Retry
                    (including                    ↓
                    auth_status)            Cookie found? Yes
                                                  ↓
                                            Redirect to /app
                                                  ↓
                                            Middleware checks cookies
                                                  ↓
                                            ✅ All set!
                                                  ↓
                                            Load dashboard
```

## Benefits

1. **Eliminates Race Conditions**: Waits for actual cookie presence, not arbitrary time
2. **Faster in Most Cases**: Redirects as soon as cookies are ready (often < 150ms)
3. **Better User Experience**: Clear error messages instead of mysterious loops
4. **More Reliable**: Works across different network speeds and browser states
5. **Debuggable**: Console logs show exactly what's happening

## Security Considerations

### Is `httpOnly: false` Safe for auth_status?

Yes, because:
1. **No Sensitive Data**: It only contains "authenticated", not tokens or user info
2. **Not Used for Auth**: The middleware still checks the httpOnly cookies (token, internal_token)
3. **Same Protections**: Still uses `sameSite: "lax"` and the secure flag
4. **Read-Only**: Client code only reads it, never modifies it

### Attack Scenarios

**Q: Can an attacker set their own auth_status cookie?**
A: Yes, but it doesn't matter. The middleware checks the httpOnly cookies (which JavaScript can't modify). The auth_status cookie is just a UI convenience.

**Q: Can an attacker steal the auth_status cookie?**
A: With XSS, yes, but they'd only learn the user is authenticated (which they already know from the UI). The actual tokens are httpOnly and can't be stolen via XSS.

**Q: What about CSRF?**
A: All cookies use `sameSite: "lax"`, providing CSRF protection.

## Testing

To verify the fix:

1. Clear all cookies
2. Open browser DevTools → Console
3. Go to login page
4. Enter credentials and submit
5. Watch console logs:
   ```
   [CLIENT] Login successful, waiting for cookies to be set
   [CLIENT] Authentication confirmed, redirecting to /app
   ```
6. Verify you're redirected to `/app` without loops

## Comparison with chemediaho

The chemediaho repository uses a different approach:
- Traditional form POST (no fetch API)
- Server renders the next page directly in the response
- No client-side redirects needed

We can't use that approach here because:
1. We have a SPA-style architecture
2. We need client-side state management
3. We want API-based authentication for future extensibility

Our solution achieves the same reliability with a modern architecture.

## Conclusion

This fix resolves the login redirect issues by:
1. Adding a verification mechanism (auth_status cookie)
2. Using polling instead of fixed delays
3. Providing clear error messages

The solution is reliable, secure, and provides a better user experience than the previous implementation.
