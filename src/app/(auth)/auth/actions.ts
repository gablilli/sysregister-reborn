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
    const resp = await fetch("https://web.spaggiari.eu/rest/v1/auth/login", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ ident: uid, password: pass, uid }),
    });

    console.log("[getUserSession] response status:", resp.status);

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("[getUserSession] Errore durante il login:", errorText);
      return { error: "Credenziali non valide.", details: errorText };
    }

    const { token, expire } = await resp.json();

    console.log("[getUserSession] token e expire ricevuti:", { token: token ? "OK" : "Mancante", expire });

    if (!token || !expire) {
      console.error("[getUserSession] Token o data di scadenza mancanti");
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
