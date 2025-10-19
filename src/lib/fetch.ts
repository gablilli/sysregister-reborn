/**
 * Robust fetch wrapper for server-side requests
 * Handles network errors in Docker/standalone mode with retry logic
 */

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Performs a fetch with retry logic and proper error handling for Docker/standalone mode
 * @param url - The URL to fetch
 * @param options - Fetch options with additional retry configuration
 * @returns Promise<Response>
 */
export async function robustFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    ...fetchOptions
  } = options;

  // Configure fetch for Docker/standalone compatibility
  const fetchConfig: RequestInit = {
    ...fetchOptions,
    // Disable keep-alive to avoid connection pooling issues in Docker
    keepalive: false,
    signal: AbortSignal.timeout(timeout),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, fetchConfig);
      
      // If response is OK, return it
      if (response.ok || response.status < 500) {
        return response;
      }

      // For 5xx errors, retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt or it's not a network error, throw
      if (attempt === retries - 1 || !(error instanceof Error) || 
          !error.message.includes('fetch failed')) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  // If all retries failed, throw the last error
  throw lastError || new Error('Failed to fetch after multiple attempts');
}

/**
 * Performs a fetch and returns the text response with retry logic
 * @param url - The URL to fetch
 * @param options - Fetch options with additional retry configuration
 * @returns Promise<string>
 */
export async function robustFetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const response = await robustFetch(url, options);
  return response.text();
}

/**
 * Performs a fetch and returns the JSON response with retry logic
 * @param url - The URL to fetch
 * @param options - Fetch options with additional retry configuration
 * @returns Promise<T>
 */
export async function robustFetchJson<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await robustFetch(url, options);
  return response.json();
}
