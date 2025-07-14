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
  if (!uid || !pass) return "Credenziali non valide.";

  const resp = await fetch("https://web.spaggiari.eu/rest/v1/auth/login", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ ident: uid, password: pass, uid }),
  });

  if (!resp.ok) return "Credenziali non valide.";
  const { token, expire } = await resp.json();
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

export async function getUserDetails() {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) return handleAuthError();

  try {
    const res = await fetch("https://web.spaggiari.eu/rest/v1/auth/status", {
      headers: {
        ...API_HEADERS,
        Authorization: `Bearer ${cookies().get("token")?.value}`,
      },
    });
    if (!res.ok) throw new Error("Auth status error");
    const data = await res.json();
    return { schoolName: data.school?.name };
  } catch {
    return handleAuthError();
  }
}

export async function verifySession() {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) return handleAuthError();

  try {
    const res = await fetch("https://web.spaggiari.eu/rest/v1/auth/status", {
      headers: {
        ...API_HEADERS,
        Authorization: `Bearer ${cookies().get("token")?.value}`,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const internalUser = await db.user.findUnique({ where: { id: userData.uid } });
    return !!(internalUser && internalUser.internalId === userData.internalId && data.authenticated);
  } catch {
    return false;
  }
}
