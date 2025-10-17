"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const API_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "CVVS/std/4.1.7 Android/10",
  "Z-Dev-Apikey": "Tg1NWEwNGIgIC0K",
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

export async function getUserSession({ uid, pass }: { uid: string; pass: string }) {
  console.log("[getUserSession] ricevo credenziali:", { uid, pass: pass ? "***" : pass });

  if (!uid || !pass) {
    console.error("[getUserSession] Credenziali mancanti o invalide");
    return { error: "Credenziali non valide." };
  }

  try {
    let token: string | null = null;
    let expire: string | null = null;
    
    // Try the REST v1 endpoint first (known to work)
    console.log("[getUserSession] Tentativo con endpoint REST v1");
    let resp = await fetch("https://web.spaggiari.eu/rest/v1/auth/login", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ ident: uid, password: pass, uid }),
    });

    console.log("[getUserSession] response status:", resp.status);

    if (resp.ok) {
      try {
        const responseData = await resp.json();
        token = responseData.token || null;
        expire = responseData.expire || null;
      } catch (e) {
        console.warn("[getUserSession] Errore parsing risposta REST v1:", e);
      }
    }

    // If the REST v1 endpoint fails or doesn't return valid data, try the new auth-p7 endpoint
    if (!token || !expire) {
      console.log("[getUserSession] Tentativo con nuovo endpoint auth-p7");
      resp = await fetch("https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ uid, pass }),
      });

      console.log("[getUserSession] auth-p7 response status:", resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("[getUserSession] Errore durante il login:", errorText);
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

    cookies().set("internal_token", tokenJwt);
    cookies().set("tokenExpiry", new Date(expire).toISOString());
    cookies().set("token", token);

    console.log("[getUserSession] Token JWT generato e cookies impostati");

    return { success: true, message: "Autenticazione riuscita." };
  } catch (error) {
    console.error("[getUserSession] Errore nella comunicazione con il server:", error);
    return { error: "Errore durante l'autenticazione. Riprova più tardi." };
  }
}
