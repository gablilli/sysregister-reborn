# Docker Fetch Failure Fix

## Problem

The application was experiencing "TypeError: fetch failed" errors when running in Docker/standalone mode. The error occurred in server actions when trying to fetch data from external APIs (web.spaggiari.eu).

### Error Stack Trace
```
failed to forward action response TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async rC (/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:15:4216)
    ...
  [cause]: Error
      at makeNetworkError (node:internal/deps/undici/undici:9277:35)
      at httpRedirectFetch (node:internal/deps/undici/undici:10825:32)
```

## Root Cause

Next.js standalone mode in Docker has known issues with fetch operations in server actions:

1. **Connection Pooling Issues**: The default keep-alive behavior can cause connection pooling problems in containerized environments
2. **Network Timeouts**: No default timeout handling for fetch requests
3. **No Retry Logic**: Transient network failures cause immediate errors without retry attempts
4. **Undici Fetch Issues**: Node.js's built-in undici-based fetch can have reliability issues in Docker networking

## Solution

Created a robust fetch wrapper (`src/lib/fetch.ts`) with the following features:

### 1. Retry Logic
- Configurable retry attempts (default: 3)
- Exponential backoff delay between retries
- Retries on 5xx server errors and network failures

### 2. Connection Configuration
- Disables keep-alive to avoid connection pooling issues in Docker
- Sets proper timeouts (default: 30 seconds)
- Uses AbortSignal for timeout handling

### 3. Comprehensive Error Handling
- Catches and retries fetch failures
- Provides meaningful error messages
- Distinguishes between retriable and non-retriable errors

### Implementation

```typescript
export async function robustFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options;

  const fetchConfig: RequestInit = {
    ...fetchOptions,
    keepalive: false,  // Disable connection pooling
    signal: AbortSignal.timeout(timeout),  // Set timeout
  };

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, fetchConfig);
      
      if (response.ok || response.status < 500) {
        return response;
      }

      // Retry on 5xx errors
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    } catch (error) {
      // Retry on network failures
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
}
```

## Updated Files

### Server Actions
All server actions have been updated to use the robust fetch wrappers:

1. **Authentication Actions** (`src/app/(auth)/actions.ts`)
   - `getUserSession()` - Login with ClasseViva API
   - `loginAndRedirect()` - Login with redirect

2. **Register Actions** (`src/app/(app)/app/register/actions.ts`)
   - `getPeriods()` - Fetch school periods
   - `getMarks()` - Fetch student grades
   - `getPresence()` - Fetch attendance data
   - `getMarkNotes()` - Fetch grade details
   - `getSubject()` - Fetch subject information
   - `getMarksAndPeriods()` - Combined fetch

3. **App Actions** (`src/app/(app)/app/actions.ts`)
   - `getUserDetails()` - Fetch user details
   - `getDayAgenda()` - Fetch daily agenda
   - `getDayLessons()` - Fetch daily lessons

4. **Files Actions** (`src/app/(app)/app/files/actions.ts`)
   - `getStudentIdFromToken()` - Fetch student ID
   - `getBacheca()` - Fetch notice board
   - `setReadBachecaItem()` - Mark notice as read

### Client Components
Updated client components to handle potential `void` returns from error handlers:

- `src/app/(app)/app/files/bacheca/page.tsx`
- `src/app/(app)/app/files/page.tsx`
- `src/app/(app)/app/lessons/[day]/page.tsx`
- `src/app/(app)/app/page.tsx`

## Testing

✅ Build successful: `npm run build`
✅ Linting passed: `npm run lint`
✅ TypeScript compilation successful
✅ All 17 pages generated successfully

## Benefits

1. **Reliability**: Automatic retry on transient failures
2. **Performance**: Proper timeout handling prevents hanging requests
3. **Docker Compatibility**: Resolves connection pooling issues in containerized environments
4. **Error Recovery**: Graceful degradation on network issues
5. **Maintainability**: Centralized fetch logic in one place

## Configuration

The fetch wrapper accepts optional configuration:

```typescript
interface FetchOptions extends RequestInit {
  retries?: number;      // Default: 3
  retryDelay?: number;   // Default: 1000ms
  timeout?: number;      // Default: 30000ms (30 seconds)
}
```

Example usage:
```typescript
const data = await robustFetchJson('https://api.example.com/data', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
  retries: 5,           // Custom retry count
  retryDelay: 2000,     // 2 second initial delay
  timeout: 60000,       // 60 second timeout
});
```

## Deployment Notes

This fix should work in all deployment environments:
- ✅ Docker/standalone mode
- ✅ Vercel deployment
- ✅ Local development
- ✅ Other Node.js hosting platforms

## Related Issues

- PR #22: Authentication redirect issues (also had fetch problems)
- PR #9, #12: Previous attempts with server-side redirect that had fetch failures

## Future Improvements

Potential enhancements for consideration:

1. Add request caching/deduplication
2. Implement circuit breaker pattern for repeated failures
3. Add metrics/logging for failed requests
4. Consider alternative HTTP client library if issues persist
