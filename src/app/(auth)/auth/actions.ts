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

  const formData = new FormData();
  formData.append("uid", uid);
  formData.append("pwd", pass);

  const req = await fetch(
    "https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd",
    {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent": "Mozilla/5.0", // Aggiunto per evitare blocchi IP
      },
    }
  );

  const html = await req.text();
  const setCookies = req.headers.get("set-cookie");
  const expiry = req.headers.get("expires");

  console.log("🧪 DEBUG LOGIN RESPONSE:");
  console.log("Set-Cookie:", setCookies);
  console.log("Expires:", expiry);
  console.log("Body:", html.slice(0, 500)); // stampa solo i primi 500 caratteri

  const token = setCookies
    ?.split("; ")
    .find((cookie) => cookie.startsWith("PHPSESSID="))
    ?.split("=")[1];

  if (!token || !expiry) {
    return "Credenziali non valide.";
  }

  const user = await db.user.upsert({
    where: { id: uid },
    create: { id: uid },
    update: { id: uid },
  });

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const alg = "HS256";

  const tokenJwt = await new SignJWT({ uid, internalId: user.internalId })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

  cookies().set("internal_token", tokenJwt);
  cookies().set("tokenExpiry", new Date(expiry).toISOString());
  cookies().set("token", token);

  return null; // login ok
}

export async function getUserDetails() {
  const internalToken = cookies().get("internal_token")?.value || "";
  const userData = await getUserDetailsFromToken(internalToken);
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
  const internalToken = cookies().get("internal_token")?.value || "";
  const userData = await getUserDetailsFromToken(internalToken);

  if (!userData) {
    return false;
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
