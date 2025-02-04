"use server";

import { get } from "@/lib/api";
import { cookies } from "next/headers";

export async function getDayLessons(date: string) {
    const studentId = cookies().get("uid")?.value;
    const res = await get(`/v1/students/${studentId}/lessons/${date}`);
    return res.lessons;
}