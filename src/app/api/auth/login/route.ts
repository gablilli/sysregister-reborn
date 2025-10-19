import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

const API_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "CVVS/std/4.1.7 Android/10",
  "Z-Dev-ApiKey": "Tg1NWEwNGIgIC0K",
};

/**
 * Sets authentication cookies with secure options.
 */
async function setAuthCookies(token: string, expire: string, tokenJwt: string) {
  const cookieStore = cookies();
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, pass } = body;

    console.log("[API /auth/login] ricevo credenziali:", { uid, pass: pass ? "***" : pass });

    if (!uid || !pass) {
      console.error("[API /auth/login] Credenziali mancanti o invalide");
      return NextResponse.json(
        { error: "Credenziali non valide." },
        { status: 400 }
      );
    }

    let token: string | null = null;
    let expire: string | null = null;
    
    // Try the REST v1 endpoint first
    console.log("[API /auth/login] Tentativo con endpoint REST v1");
    let resp = await fetch("https://web.spaggiari.eu/rest/v1/auth/login", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ ident: null, pass: pass, uid: uid }),
    });

    console.log("[API /auth/login] response status:", resp.status);
    
    const responseText = await resp.text();
    console.log("[API /auth/login] response body:", responseText);

    if (resp.ok) {
      try {
        const responseData = JSON.parse(responseText);
        token = responseData.token || null;
        expire = responseData.expire || null;
      } catch (e) {
        console.warn("[API /auth/login] Errore parsing risposta REST v1:", e);
      }
    } else {
      console.error("[API /auth/login] REST v1 failed with status:", resp.status);
    }

    // If the REST v1 endpoint fails, try the auth-p7 endpoint
    if (!token || !expire) {
      console.log("[API /auth/login] Tentativo con nuovo endpoint auth-p7");
      resp = await fetch("https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ uid, pass }),
      });

      console.log("[API /auth/login] auth-p7 response status:", resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("[API /auth/login] Errore durante il login:", errorText);
        
        let errorMsg = "Credenziali non valide.";
        if (errorText.includes("Access Denied")) {
          errorMsg = "Accesso bloccato dal server ClasseViva.";
        }
        
        return NextResponse.json({ error: errorMsg }, { status: 401 });
      }

      try {
        const responseData = await resp.json();
        token = responseData.token || responseData.data?.token || null;
        expire = responseData.expire || responseData.data?.expire || null;
      } catch (e) {
        console.error("[API /auth/login] Errore parsing risposta auth-p7:", e);
        return NextResponse.json(
          { error: "Errore durante l'autenticazione. Riprova più tardi." },
          { status: 500 }
        );
      }
    }

    console.log("[API /auth/login] token e expire ricevuti:", { token: token ? "OK" : "Mancante", expire });

    if (!token || !expire || typeof token !== 'string' || typeof expire !== 'string') {
      console.error("[API /auth/login] Token o data di scadenza mancanti o non validi");
      return NextResponse.json(
        { error: "Credenziali non valide." },
        { status: 401 }
      );
    }

    // Create or update user in database
    const user = await db.user.upsert({
      where: { id: uid },
      create: { id: uid },
      update: { id: uid },
    });

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const tokenJwt = await new SignJWT({ uid, internalId: user.internalId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    // Set authentication cookies
    await setAuthCookies(token, expire, tokenJwt);

    console.log("[API /auth/login] Token JWT generato e cookies impostati, successo");

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /auth/login] Errore nella comunicazione con il server:", error);
    return NextResponse.json(
      { error: "Errore durante l'autenticazione. Riprova più tardi." },
      { status: 500 }
    );
  }
}
