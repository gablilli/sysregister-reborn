'use server';

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export async function getUserSession({ uid, pass }: { uid: string; pass: string }) {
  if (!uid || !pass) return 'Credenziali non valide.';

  const body = {
    ident: null,
    pass: pass,
    uid: uid,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Z-Dev-ApiKey': 'Tg1NWEwNGIgIC0K',
    'User-Agent': 'CVVS/std/4.1.7 Android/10',
  };

  try {
    const res = await fetch('https://web.spaggiari.eu/rest/v1/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      return 'Credenziali non valide.';
    }

    const token = data.token;
    const studentId = uid.replace(/\D/g, '');

    await db.user.upsert({
      where: { id: uid },
      create: { id: uid, internalId: studentId },
      update: { internalId: studentId },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await new SignJWT({ uid, internalId: studentId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);

    // Setta i cookie
    cookies().set('internal_token', jwt);
    cookies().set('token', token);
    cookies().set('tokenExpiry', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());

    return null;

  } catch (err) {
    console.error(err);
    return 'Errore durante il login.';
  }
}

// Verifica che il token JWT sia valido e ritorna true/false
export async function verifySession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('internal_token')?.value;

    if (!token) return false;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return !!payload.uid;
  } catch {
    return false;
  }
}

// Prende i dettagli utente dal database
export async function getUserDetails(uid: string) {
  const user = await db.user.findUnique({ where: { id: uid } });
  return user || null;
}
