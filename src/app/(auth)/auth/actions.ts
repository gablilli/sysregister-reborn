"use server";

import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { JSDOM } from "jsdom";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { getUserDetailsFromToken } from "@/lib/utils";

export async function getUserSession({ uid, pass }: { uid: string; pass: string }) {
  if (!uid || !pass) {
    return "Credenziali non valide.";
  }

  const formData = new URLSearchParams();
  formData.append("uid", uid);
  formData.append("pwd", pass);

  const req = await fetch(
    "https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    }
  );

  const text = await req.text();
  console.log("Response text from auth API:", text);

  const setCookieHeader = req.headers.get("set-cookie");
  console.log("Set-Cookie header:", setCookieHeader);

  if (!setCookieHeader) {
    return "Credenziali non valide.";
  }

  const setCookies = setCookieHeader.split("; ");
  const expiry = req.headers.get("expires");
  const token = setCookies.find((cookie) => cookie.startsWith("PHPSESSID="))?.split("=")[1];

  if (!token || !expiry) {
    return "Credenziali non valide.";
  }

  const user = await db.user.upsert({
    where: { id: uid },
    create: { id: uid },
    update: { id: uid },
  });

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET non definito nelle variabili d'ambiente");
    return "Errore interno.";
  }

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

  return true;
}

export async function getUserDetails() {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  const page = await (
    await fetch("https://web.spaggiari.eu/home/app/default/menu_webinfoschool_genitori.php", {
      headers: {
        Cookie: `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
      },
    })
  ).text();
  const dom = new JSDOM(page);
  try {
    const schoolName = dom.window.document.querySelector("span.scuola")?.textContent;
    return {
      schoolName,
    };
  } catch {
    return handleAuthError();
  }
}

export async function verifySession() {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  const page = await (
    await fetch("https://web.spaggiari.eu/home/app/default/menu_webinfoschool_genitori.php", {
      headers: {
        Cookie: `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
      },
    })
  ).text();
  const dom = new JSDOM(page);
  try {
    if (dom.window.document.querySelector("span.scuola")) {
      const internalUser = await db.user.findUnique({
        where: { id: userData.uid },
      });
      if (internalUser && internalUser.internalId === userData.internalId) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch {
    return false;
  }
}
