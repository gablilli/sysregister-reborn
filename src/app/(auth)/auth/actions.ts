"use server";

import { post } from "@/lib/api";
import { cookies } from "next/headers";

export async function getUserSession({ uid, pass }: { uid: string, pass: string }) {
    const loginResponse: { token: string, ident: string, expire: string } = await post("/v1/auth/login", {
        uid,
        pass
    });
    if (!loginResponse.token) {
        return "Credenziali non valide.";
    }
    cookies().set("tokenExpiry", loginResponse.expire);
    cookies().set("token", loginResponse.token);
    cookies().set("uid", (loginResponse.ident).slice(1, -1));
}