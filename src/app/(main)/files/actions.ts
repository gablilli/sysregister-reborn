"use server";

import { get } from "@/lib/api";
import { cookies } from "next/headers";

export async function getBacheca() {
    const studentId = cookies().get("uid")?.value;
    const res = await get(`/v1/students/${studentId}/noticeboard`);
    return res.items;
}