"use server";

import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { getUserDetailsFromToken } from "@/lib/utils";

const API_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "CVVS/std/4.1.7 Android/10",
  "Z-Dev-Apikey": "Tg1NWEwNGIgIC0K",
};

export async function getUserSession({ uid, pass }: { uid: string; pass: string }) {
  console.log("[getUserSession] ricevo credenziali:", { uid, pass: pass ? "***" : pass });

  if (!uid || !pass) return "Credenziali non valide.";

  const resp = await fetch("https://web.spaggiari.eu/rest/v1/auth/login", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ ident: uid, password: pass, uid }),
  });

  console.log("[getUserSession] response status:", resp.status);

  if (!resp.ok) {
    const errorText = await resp.text();
    console.log("[getUserSession] response non ok:", errorText);
    return "Credenziali non valide.";
  }

  const { token, expire } = await resp.json();

  console.log("[getUserSession] token e expire ricevuti:", { token: token ? "OK" : "Mancante", expire });

  if (!token || !expire) return "Credenziali non valide.";

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
}
