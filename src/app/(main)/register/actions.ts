"use server";

import { get } from "@/lib/api";
import { cookies } from "next/headers";

export async function getPeriods() {
    const studentId = cookies().get("uid")?.value;
    const res = await get(`/v1/students/${studentId}/periods`);
    return res.periods;
}

export async function getMarks() {
    const studentId = cookies().get("uid")?.value;
    const res = await get(`/v1/students/${studentId}/grades`);
    return res.grades;
}