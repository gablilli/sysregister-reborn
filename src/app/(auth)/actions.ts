"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { robustFetch } from "@/lib/fetch";

const API_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "CVVS/std/4.1.7 Android/10",
  "Z-Dev-ApiKey": "Tg1NWEwNGIgIC0K",
};

export async function verifySession() {
  try {
    const token = cookies().get("token")?.value;
    const tokenExpiry = cookies().get("tokenExpiry")?.value;
    const internal_token = cookies().get("internal_token")?.value;

    if (!token || !tokenExpiry || !internal_token) {
      return false;
    }

    const tokenExpiryDate = new Date(tokenExpiry);
    if (tokenExpiryDate <= new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("[verifySession] Errore nella verifica della sessione:", error);
    return false;
  }
}

/**
 * Sets authentication cookies with secure options.
 * @param token - ClasseViva API token
 * @param expire - Token expiration date string
 * @param tokenJwt - Internal JWT token for user identification
 */
async function setAuthCookies(token: string, expire: string, tokenJwt: string) {
  const cookieStore = cookies();
  // In production, only use secure cookies if HTTPS is available
  // For Docker deployments without HTTPS, set COOKIE_SECURE=false in environment
  // Default to false for safety (works with both HTTP and HTTPS, though less secure over HTTP)
  const useSecureCookies = process.env.COOKIE_SECURE === 'true';
  
  cookieStore.set("internal_token", tokenJwt, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
  cookieStore.set("tokenExpiry", new Date(expire).toISOString(), {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
}

export async function getUserSession({ uid, pass }: { uid: string; pass: string }) {
  console.log("[getUserSession] ricevo credenziali:", { uid, pass: pass ? "***" : pass });

  if (!uid || !pass) {
    console.error("[getUserSession] Credenziali mancanti o invalide");
    return { error: "Credenziali non valide." };
  }

  try {
    let token: string | null = null;
    let expire: string | null = null;
    let restV1Error: string | null = null;
    
    // Try the REST v1 endpoint first (known to work)
    console.log("[getUserSession] Tentativo con endpoint REST v1");
    let resp = await robustFetch("https://web.spaggiari.eu/rest/v1/auth/login", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ ident: null, pass: pass, uid: uid }),
    });

    console.log("[getUserSession] response status:", resp.status);
    
    // Log response text for debugging
    const responseText = await resp.text();
    console.log("[getUserSession] response body:", responseText);

    if (resp.ok) {
      try {
        const responseData = JSON.parse(responseText);
        token = responseData.token || null;
        expire = responseData.expire || null;
      } catch (e) {
        console.warn("[getUserSession] Errore parsing risposta REST v1:", e);
      }
    } else {
      restV1Error = responseText;
      console.error("[getUserSession] REST v1 failed with status:", resp.status, "body:", responseText);
    }

    // If the REST v1 endpoint fails or doesn't return valid data, try the new auth-p7 endpoint
    if (!token || !expire) {
      console.log("[getUserSession] Tentativo con nuovo endpoint auth-p7");
      resp = await robustFetch("https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ uid, pass }),
      });

      console.log("[getUserSession] auth-p7 response status:", resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("[getUserSession] Errore durante il login:", errorText);
        
        // If both endpoints failed, check if it's geo-blocking
        if (errorText.includes("Access Denied") || (restV1Error && restV1Error.includes("Access Denied"))) {
          return { 
            error: "Accesso bloccato dal server ClasseViva. L'applicazione potrebbe essere geo-bloccata quando deployata su Vercel.", 
            details: errorText 
          };
        }
        
        return { error: "Credenziali non valide.", details: errorText };
      }

      try {
        const responseData = await resp.json();
        token = responseData.token || responseData.data?.token || null;
        expire = responseData.expire || responseData.data?.expire || null;
      } catch (e) {
        console.error("[getUserSession] Errore parsing risposta auth-p7:", e);
        return { error: "Errore durante l'autenticazione. Riprova più tardi." };
      }
    }

    console.log("[getUserSession] token e expire ricevuti:", { token: token ? "OK" : "Mancante", expire });

    if (!token || !expire || typeof token !== 'string' || typeof expire !== 'string') {
      console.error("[getUserSession] Token o data di scadenza mancanti o non validi");
      return { error: "Credenziali non valide." };
    }

    const user = await db.user.upsert({
      where: { id: uid },
      create: { id: uid },
      update: { id: uid },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const tokenJwt = await new SignJWT({ uid, internalId: user.internalId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    await setAuthCookies(token, expire, tokenJwt);

    console.log("[getUserSession] Token JWT generato e cookies impostati");

    return { success: true, message: "Autenticazione riuscita." };
  } catch (error) {
    console.error("[getUserSession] Errore nella comunicazione con il server:", error);
    return { error: "Errore durante l'autenticazione. Riprova più tardi." };
  }
}

/**
 * Authenticates user with ClasseViva API and sets authentication cookies.
 * 
 * This function handles the complete login flow:
 * 1. Validates credentials with ClasseViva API
 * 2. Creates/updates user in database
 * 3. Sets authentication cookies
 * 4. Returns success for client-side redirect (with delay to ensure cookie propagation)
 * 
 * @param uid - User ID (ClasseViva username)
 * @param pass - Password
 * @param redirectTo - Optional redirect target (defaults to "/app")
 * @returns Success object with redirect URL or error object if authentication fails
 */

// Only allow a restricted set of safe redirect destinations
const ALLOWED_REDIRECTS = ["/app", "/app/profile", "/app/register"];
function sanitizeRedirect(redirectTo: string | undefined | null): string {
  if (typeof redirectTo !== 'string') return "/app";
  // Only allow exact matches, not prefixes
  if (ALLOWED_REDIRECTS.includes(redirectTo)) return redirectTo;
  return "/app";
}

export async function loginAndRedirect({ uid, pass, redirectTo }: { uid: string; pass: string; redirectTo?: string | null }) {
  console.log("[loginAndRedirect] ricevo credenziali:", { uid, pass: pass ? "***" : pass });

  if (!uid || !pass) {
    console.error("[loginAndRedirect] Credenziali mancanti o invalide");
    return { error: "Credenziali non valide." };
  }

  try {
    let token: string | null = null;
    let expire: string | null = null;
    let restV1Error: string | null = null;
    
    // Try the REST v1 endpoint first (known to work)
    console.log("[loginAndRedirect] Tentativo con endpoint REST v1");
    let resp = await robustFetch("https://web.spaggiari.eu/rest/v1/auth/login", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ ident: null, pass: pass, uid: uid }),
    });

    console.log("[loginAndRedirect] response status:", resp.status);
    
    // Log response text for debugging
    const responseText = await resp.text();
    console.log("[loginAndRedirect] response body:", responseText);

    if (resp.ok) {
      try {
        const responseData = JSON.parse(responseText);
        token = responseData.token || null;
        expire = responseData.expire || null;
      } catch (e) {
        console.warn("[loginAndRedirect] Errore parsing risposta REST v1:", e);
      }
    } else {
      restV1Error = responseText;
      console.error("[loginAndRedirect] REST v1 failed with status:", resp.status, "body:", responseText);
    }

    // If the REST v1 endpoint fails or doesn't return valid data, try the new auth-p7 endpoint
    if (!token || !expire) {
      console.log("[loginAndRedirect] Tentativo con nuovo endpoint auth-p7");
      resp = await robustFetch("https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ uid, pass }),
      });

      console.log("[loginAndRedirect] auth-p7 response status:", resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("[loginAndRedirect] Errore durante il login:", errorText);
        
        // If both endpoints failed, check if it's geo-blocking
        if (errorText.includes("Access Denied") || (restV1Error && restV1Error.includes("Access Denied"))) {
          return { 
            error: "Accesso bloccato dal server ClasseViva. L'applicazione potrebbe essere geo-bloccata quando deployata su Vercel.", 
            details: errorText 
          };
        }
        
        return { error: "Credenziali non valide.", details: errorText };
      }

      try {
        const responseData = await resp.json();
        token = responseData.token || responseData.data?.token || null;
        expire = responseData.expire || responseData.data?.expire || null;
      } catch (e) {
        console.error("[loginAndRedirect] Errore parsing risposta auth-p7:", e);
        return { error: "Errore durante l'autenticazione. Riprova più tardi." };
      }
    }

    console.log("[loginAndRedirect] token e expire ricevuti:", { token: token ? "OK" : "Mancante", expire });

    if (!token || !expire || typeof token !== 'string' || typeof expire !== 'string') {
      console.error("[loginAndRedirect] Token o data di scadenza mancanti o non validi");
      return { error: "Credenziali non valide." };
    }

    const user = await db.user.upsert({
      where: { id: uid },
      create: { id: uid },
      update: { id: uid },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const tokenJwt = await new SignJWT({ uid, internalId: user.internalId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    await setAuthCookies(token, expire, tokenJwt);

    console.log("[loginAndRedirect] Token JWT generato e cookies impostati, successo");

    // Return success with redirect URL for client-side navigation
    // Using client-side redirect with a small delay to ensure cookies are fully propagated
    // This avoids Docker RSC payload fetch issues while ensuring cookie availability
    return { success: true, redirectTo: sanitizeRedirect(redirectTo) };
  } catch (error) {
    console.error("[loginAndRedirect] Errore nella comunicazione con il server:", error);
    return { error: "Errore durante l'autenticazione. Riprova più tardi." };
  }
}
