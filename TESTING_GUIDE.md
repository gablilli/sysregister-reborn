# Testing Guide

## Quick Test in Docker

1. **Build and start the container:**
   ```bash
   docker compose down
   docker compose up -d --build
   ```

2. **Check logs to ensure no build errors:**
   ```bash
   docker compose logs -f
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

4. **Login with ClasseViva credentials**
   - Enter your username (e.g., G123456789P)
   - Enter your password
   - Click "Accesso"

5. **Expected behavior:**
   - ✅ No "fetch failed" error in Docker logs
   - ✅ Successfully redirects to /app
   - ✅ User sees the app dashboard
   - ✅ Middleware accepts the authentication

## What to Check in Docker Logs

### Success indicators:
```
[loginAndRedirect] Tentativo con endpoint REST v1
[loginAndRedirect] response status: 200
[loginAndRedirect] token e expire ricevuti: { token: 'OK', expire: '...' }
[loginAndRedirect] Token JWT generato e cookies impostati, successo
```

### What should NOT appear:
```
failed to forward action response TypeError: fetch failed
```

## Browser Console Logs

Open browser DevTools (F12) and check the Console:

### Success indicators:
```
[CLIENT] Attempting login with uid: G123456789P
[CLIENT] Login successful, redirecting to app
```

### Error indicators (if any):
```
[CLIENT] Login failed with error: Credenziali non valide.
```

## Cookie Verification

1. Open browser DevTools (F12)
2. Go to Application → Cookies → http://localhost:3000
3. Check for these cookies:
   - ✅ `token` - ClasseViva API token
   - ✅ `internal_token` - JWT token
   - ✅ `tokenExpiry` - Expiration timestamp
   - ❌ `auth_error` - Should NOT be present on success

## Error Testing

Test with invalid credentials to verify error handling:

1. Enter incorrect username/password
2. Click "Accesso"
3. Expected behavior:
   - ❌ Should see error message: "Credenziali non valide."
   - ❌ Should NOT redirect
   - ❌ Should stay on login page

## Network Tab Verification

1. Open browser DevTools (F12) → Network tab
2. Attempt login
3. Look for the server action call
4. Check Response:
   - Should be empty or minimal (not a JSON object)
   - Status should be 200 OK
   - Cookies should be set in response headers

## Troubleshooting

### If login still fails:

1. **Check environment variables:**
   ```bash
   docker compose exec app env | grep -E 'JWT_SECRET|DATABASE_URL|COOKIE_SECURE'
   ```
   - `JWT_SECRET` should be set
   - `DATABASE_URL` should point to the database
   - `COOKIE_SECURE` should be 'false' for HTTP (default)

2. **Check database connection:**
   ```bash
   docker compose logs db
   ```

3. **Check ClasseViva API is reachable:**
   ```bash
   docker compose exec app curl -I https://web.spaggiari.eu/rest/v1/auth/login
   ```

4. **Restart with clean state:**
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

## Success Criteria

✅ Login completes without "fetch failed" error  
✅ Cookies are set properly  
✅ Redirect to /app works  
✅ User can access protected routes  
✅ No complex response handling needed  
✅ Simple, clean, reliable  

## Next Steps After Success

1. Test with multiple users
2. Test logout and re-login
3. Test session expiration
4. Test "goto" redirect parameter (e.g., ?goto=/app/profile)
5. Deploy to production

---

**If this works, the issue is finally resolved after 14 attempts!** 🎉
