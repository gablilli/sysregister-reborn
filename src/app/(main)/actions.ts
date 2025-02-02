"use server";

import { formatDate, get } from "@/lib/api";
import { cookies } from "next/headers";

export async function getDayAgenda(date: Date) {
    const studentId = cookies().get("uid")?.value;
    const res = await get(`/v1/students/${studentId}/agenda/all/${formatDate(date)}/${formatDate(date)}`);
    return res.agenda;
}

export async function getDayLessons(date: Date) {
    const studentId = cookies().get("uid")?.value;
    const res = await get(`/v1/students/${studentId}/lessons/${formatDate(date)}`);
    return res.lessons;
}