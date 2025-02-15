"use server";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/lib/perms";
import { cookies } from "next/headers";

export async function getLeaderboard() {
    const userId = cookies().get("uid")?.value
    const currentUser = await db.user.findFirst({
        where: {
            internalId: cookies().get("internal_id")?.value
        }
    });
    if (!currentUser) {
        return handleAuthError();
    }
    if (!hasPermission(currentUser.permissions, PERMISSIONS.VERIFIED)) {
        return;
    }
    const leaderboard = await db.user.findMany({
        orderBy: {
            average: 'desc'
        },
        select: {
            name: true,
            average: true,
            hasAcceptedSocialTerms: true,
            id: true
        }
    }).then(users => users.filter(user => user.average !== null && user.hasAcceptedSocialTerms && user.name !== null));
    return leaderboard.map(user => ({
        isRequestingUser: user.id === userId,
        name: user.name,
        average: user.average
    }));
}