"use server";

import { verifySession } from "@/app/(auth)/auth/actions";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function getUserPermissions() {
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        return await db.user.findUnique({
            where: { id: cookies().get("uid")?.value },
            select: {
                permissions: true
            }
        });
    } catch {
        return "Internal Server Error.";
    }
}

export async function hasUserAcceptedSocialTerms() {
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        const user = await db.user.findUnique({
            where: { id: cookies().get("uid")?.value }
        });
        return user?.hasAcceptedSocialTerms;
    } catch {
        return "Internal Server Error.";
    }
}

// this seems unsafe... need better way to handle user id
export async function acceptSocialTerms() {
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        await db.user.update({
            where: { id: cookies().get("uid")?.value },
            data: {
                hasAcceptedSocialTerms: true
            }
        });
    } catch {
        return "Internal Server Error.";
    }
}

export async function revokeSocialTerms() {
    if (!(await verifySession())) {
        return handleAuthError();
    }
    try {
        await db.user.update({
            where: { id: cookies().get("uid")?.value },
            data: {
                hasAcceptedSocialTerms: false
            }
        });
    } catch {
        return "Internal Server Error.";
    }
}