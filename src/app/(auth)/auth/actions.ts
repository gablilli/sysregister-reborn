"use server";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { JSDOM } from "jsdom";
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

    const user = await db.user.upsert({
        where: { id: uid },
        create: { id: uid },
        update: { id: uid }
    });

    cookies().set("tokenExpiry", new Date(expiry).toISOString());
    cookies().set("token", token);
    cookies().set("uid", uid);
    cookies().set("internal_id", user.internalId as string);

    getUserDetails();
}

export async function getUserDetails() {
    const page = await (await fetch("https://web.spaggiari.eu/home/app/default/menu_webinfoschool_genitori.php", {
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${cookies().get("uid")?.value};`,
        },
    })).text();
    const dom = new JSDOM(page);
    try {
        const schoolName = dom.window.document.querySelector("span.scuola")?.textContent;
        return {
            schoolName
        };
    } catch {
        return handleAuthError();
    }
}

export async function verifySession() {
    const page = await (await fetch("https://web.spaggiari.eu/home/app/default/menu_webinfoschool_genitori.php", {
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${cookies().get("uid")?.value};`,
        },
    })).text();
    const dom = new JSDOM(page);
    try {
        if (dom.window.document.querySelector("span.scuola")) {
            const internalUser = await db.user.findUnique({
                where: { id: cookies().get("uid")?.value }
            });
            if (internalUser && internalUser.internalId === cookies().get("internal_id")?.value) {
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