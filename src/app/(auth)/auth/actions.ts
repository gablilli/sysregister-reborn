"use server";

import { db } from "@/lib/db";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function getUserSession({ uid, pass }: { uid: string; pass: string }) {
  if (!uid || !pass) {
    return "Credenziali non valide.";
  }

  const formData = new FormData();
  formData.append("uid", uid);
  formData.append("pwd", pass);

  const req = await fetch(
    `https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd`,
    {
      method: "POST",
      body: formData,
    }
  );

  const setCookies = req.headers.get("set-cookie")?.split("; ");
  const expiry = req.headers.get("expires");
  const token = setCookies?.find((cookie) => cookie.startsWith("PHPSESSID="))?.split("=")[1];

  if (!token || !expiry) {
    return "Credenziali non valide.";
  }

  const user = await db.user.upsert({
    where: { id: uid },
    create: { id: uid },
    update: { id: uid },
  });

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const alg = "HS256";
  const tokenJwt = await new SignJWT({ uid, internalId: user.internalId })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

  cookies().set("internal_token", tokenJwt);
  cookies().set("tokenExpiry", new Date(expiry).toISOString());
  cookies().set("token", token);

  return null; // nessun errore = successo
}
