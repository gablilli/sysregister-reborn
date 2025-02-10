"use server";
import { db } from "@/lib/db";

export async function getLeaderboard() {
    const leaderboard = await db.user.findMany({
        orderBy: {
            average: 'desc'
        },
        select: {
            name: true,
            average: true,
            hasAcceptedSocialTerms: true
        }
    }).then(users => users.filter(user => user.average !== null && user.hasAcceptedSocialTerms));
    return leaderboard.map(user => ({
        name: user.name,
        average: user.average
    }));
}