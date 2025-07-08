"use server";

import { handleAuthError } from "@/lib/api";
import { cookies } from "next/headers";
import { getSessionUser } from "@/app/(auth)/auth/actions";

export async function getBacheca() {
    const user = await getSessionUser();
    if (!user) return handleAuthError();
    const formData = new FormData();
    formData.append("action", "get_comunicazioni");
    const res = await fetch(`https://web.spaggiari.eu/sif/app/default/bacheca_personale.php`, {
        method: "POST",
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${user.id};`,
        },
        body: formData
    });
    let data;
    try {
        data = await res.json();
    } catch {
        return handleAuthError();
    }
    return data;
}

export async function setReadBachecaItem(itemId: string) {
    const user = await getSessionUser();
    if (!user) return handleAuthError();
    const formData = new FormData();
    formData.append("action", "read_all");
    formData.append("id_relazioni", `[${itemId}]`);
    await fetch(`https://web.spaggiari.eu/sif/app/default/bacheca_personale.php`, {
        method: "POST",
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${user.id};`,
        },
        body: formData
    });
    return true;
}
