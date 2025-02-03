"use server";

import { get } from "@/lib/api";
import { GradeType, PeriodType } from "@/lib/types";
import { cookies } from "next/headers";

export async function fetchPeriods(): Promise<PeriodType[]> {
    const studentId = await cookies().get("uid")?.value;
    return (await get(`/v1/students/${studentId}/periods`)).periods;
}

export async function fetchMarks(): Promise<GradeType[]> {
    const studentId = await cookies().get("uid")?.value;
    return (await get(`/v1/students/${studentId}/grades`)).grades;
}