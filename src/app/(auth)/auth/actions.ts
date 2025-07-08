"use server";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { JSDOM } from "jsdom";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { getUserDetailsFromToken } from "@/lib/utils";

export async function getUserSession({ uid, pass }: { uid: string, pass: string }) {
    if (!uid || !pass) {
        return "Credenziali non valide.";
    }

    const formData = new FormData();
    formData.append("uid", uid);
    formData.append("pass", pass); // Fixato da pwd a pass

    let req;
    try {
        req = await fetch("https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd", {
            method: "POST",
            body: formData
        });
    } catch {
        return "Errore di connessione a Spaggiari.";
    }

    const cookieHeader = req.headers.get("set-cookie") || "";
    const match = cookieHeader.match(/PHPSESSID=([a-zA-Z0-9]+)/);
    const token = match?.[1];

    if (!token) {
        return "Credenziali non valide.";
    }

    const user = await db.user.upsert({
        where: { id: uid },
        create: { id: uid },
        update: { id: uid }
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const alg = "HS256";
    const tokenJwt = await new SignJWT({ uid, internalId: user.internalId })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(secret);

    cookies().set("internal_token", tokenJwt);
    cookies().set("token", token);
    cookies().set("tokenExpiry", new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()); // fallback
}
