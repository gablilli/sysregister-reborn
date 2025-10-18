"use server";

import { handleAuthError } from "@/lib/api";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";

const API_HEADERS = {
  "User-Agent": "zorro/1.0",
  "Z-Dev-Apikey": "+zorro+",
};

async function getStudentIdFromToken(): Promise<string | null> {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  const res = await fetch("https://web.spaggiari.eu/rest/v1/users/me", {
    headers: {
      ...API_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json?.ident || null;
}

export async function getBacheca() {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) return handleAuthError();

  const token = cookies().get("token")?.value;
  const studentId = await getStudentIdFromToken();
  if (!token || !studentId) return handleAuthError();

  const res = await fetch(`https://web.spaggiari.eu/rest/v1/students/${studentId}/notes`, {
    headers: {
      ...API_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    return await res.json();
  } catch {
    return handleAuthError();
  }
}

export async function setReadBachecaItem(itemId: string) {
  // Only allow alphanumeric IDs and dashes (e.g., UUIDs). Adjust as needed for your use-case.
  if(!/^[\w-]+$/.test(itemId)) {
    return handleAuthError();
  }
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) return handleAuthError();

  const token = cookies().get("token")?.value;
  const studentId = await getStudentIdFromToken();
  if (!token || !studentId) return handleAuthError();

  const res = await fetch(
    `https://web.spaggiari.eu/rest/v1/students/${studentId}/notes/${itemId}/read`,
    {
      method: "PUT",
      headers: {
        ...API_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.ok;
}
