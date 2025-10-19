"use server";

import { cookies } from "next/headers";

/**
 * Verifies if the current session is valid.
 * Checks for the presence and validity of authentication cookies.
 * 
 * @returns true if session is valid, false otherwise
 */
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
