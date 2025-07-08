'use server';

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

export async function getUserSession({ uid, pass }: { uid: string, pass: string }) {
    if (!uid || !pass) return "Credenziali non valide.";

    const res = await fetch("https://web.spaggiari.eu/rest/v1/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Z-Dev-ApiKey": "Tg1NWEwNGIgIC0K",
            "User-Agent": "CVVS/std/4.1.7 Android/10"
        },
        body: JSON.stringify({
            ident: null,
            uid,
            pass
        })
    });

    if (!res.ok) {
        return "Credenziali non valide.";
    }

    const data = await res.json();
    const token = data.token;
    if (!token) {
        return "Token mancante.";
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
    cookies().set("token", token); // il vero token usato nelle richieste future

    return "Login OK";
}
