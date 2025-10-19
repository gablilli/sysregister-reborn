import { cookies } from "next/headers";

/**
 * Handles authentication errors by clearing cookies and returning null.
 * Does not redirect to avoid Next.js internal fetch issues in Docker/standalone mode.
 * Client components should check for null returns and handle redirect themselves.
 */
export async function handleAuthError() {
    cookies().delete("token");
    cookies().delete("tokenExpiry");
    cookies().delete("internal_token");
    return null;
}