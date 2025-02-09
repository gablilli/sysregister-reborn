"use server";
import { handleAuthError } from "@/lib/api";
import { AgendaItemType } from "@/lib/types";
import { cookies } from "next/headers";

export async function getDayAgenda(date: Date) {
    const formData = new FormData();
    formData.append("start", Math.floor(new Date(date.setHours(0, 0, 0, 0)).getTime() / 1000).toString());
    formData.append("end", Math.floor(new Date(date.setDate(date.getDate() + 1)).setHours(0, 0, 0, 0) / 1000).toString());
    const res = await fetch(`https://web.spaggiari.eu/fml/app/default/agenda_studenti.php?ope=get_events`, {
        method: "POST",
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${cookies().get("uid")?.value};`,
        },
        body: formData
    })
    let data;
    try {
        data = (await res.json()).filter((item: AgendaItemType) => item.tipo === "nota");
    } catch {
        return handleAuthError();
    }
    return data;
}

export async function getDayLessons(date: Date) {
    const formattedDate = date.toISOString().split('T')[0];
    const res = await fetch(`https://web.spaggiari.eu/fml/app/default/attivita_studente.php?a=get_lezioni&data=${formattedDate}`, {
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${cookies().get("uid")?.value};`,
        },
    });
    let data;
    try {
        data = (await res.json()).data;
    } catch {
        return handleAuthError();
    }
    return data;
}