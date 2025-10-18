"use server";

import { verifySession } from "@/app/(auth)/actions";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";

export async function getUserPermissions() {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        return await db.user.findUnique({
            where: { id: userData.uid },
            select: {
                permissions: true
            }
        });
    } catch {
        return "Internal Server Error.";
    }
}

export async function hasUserAcceptedSocialTerms() {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        const user = await db.user.findUnique({
            where: { id: userData.uid }
        });
        return user?.hasAcceptedSocialTerms;
    } catch {
        return "Internal Server Error.";
    }
}

export async function acceptSocialTerms() {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        await db.user.update({
            where: { id: userData.uid },
            data: {
                hasAcceptedSocialTerms: true
            }
        });
    } catch {
        return "Internal Server Error.";
    }
}

export async function revokeSocialTerms() {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        await db.user.update({
            where: { id: userData.uid },
            data: {
                hasAcceptedSocialTerms: false
            }
        });
    } catch {
        return "Internal Server Error.";
    }
}