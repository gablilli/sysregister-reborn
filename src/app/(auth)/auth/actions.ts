"use server";
import { cookies } from "next/headers";
export async function getUserSession({ uid, pass }: { uid: string, pass: string }) {
    if (!uid || !pass) {
        return "Credenziali non valide.";
    }

    const formData = new FormData();
    formData.append("uid", uid);
    formData.append("pwd", pass);
    const req = await fetch(`https://web.spaggiari.eu/auth-p7/app/default/AuthApi4.php?a=aLoginPwd`, {
        method: "POST",
        body: formData
    });

    const setCookies = req.headers.get("set-cookie")?.split("; ");
    const expiry = req.headers.get("expires");
    const token = setCookies?.find(cookie => cookie.startsWith("HttpOnly, PHPSESSID="))?.split("=")[1];

    if (!token || !expiry) {
        return "Credenziali non valide.";
    }

    cookies().set("tokenExpiry", new Date(expiry).toISOString());
    cookies().set("token", token);
    cookies().set("uid", uid);
}