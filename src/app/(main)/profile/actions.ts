"use server";

import { verifySession } from "@/app/(auth)/auth/actions";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { getUserDetailsFromToken } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import path from 'path';
import sharp from 'sharp';

export async function getUserData(userId?: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (userId == userData.internalId) {
        redirect("/profile");
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }

    const [user, postCountResult] = await Promise.all([
        db.user.findUnique({
            where: { internalId: userId || userData.internalId },
            select: {
                internalId: true,
                lastServerDataUpdate: true,
                name: true,
                school: true,
                average: true,
                absencesHours: true,
                delays: true,
                permissions: true,
                bio: true,
                followers: true,
                hasAcceptedSocialTerms: true,
            }
        }),
        db.post.findMany({
            where: {
                authorId: userId || userData.internalId,
            },
            select: {
                likes: true,
            }
        })
    ]);
    if (!user?.hasAcceptedSocialTerms) {
        return null;
    }
    const [averageRank, absencesRank, delaysRank] = await Promise.all([
        db.user.count({
            where: {
                average: {
                    gt: user?.average || 0,
                },
                hasAcceptedSocialTerms: true,
            },
        }),
        db.user.count({
            where: {
                absencesHours: {
                    gt: user?.absencesHours || 0,
                },
                hasAcceptedSocialTerms: true,
            },
        }),
        db.user.count({
            where: {
                delays: {
                    gt: user?.delays || 0,
                },
                hasAcceptedSocialTerms: true,
            },
        }),
    ]);

    const isFollowed = user?.followers?.some(follow => follow.followedId === (userId || userData.internalId)) || false;
    const likeCount = postCountResult.reduce((acc, post) => acc + post.likes.length, 0);
    const userRanking = {
        averageRank: averageRank + 1,
        absencesRank: absencesRank + 1,
        delaysRank: delaysRank + 1,
        followCount: user?.followers?.length || 0,
        isFollowed: isFollowed,
    };

    return { ...user, likeCount, ...userRanking };
}

export async function followUser(userId: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }

    await db.followUserInteraction.upsert({
        where: {
            id: `${userData.internalId}_${userId}`,
        },
        create: {
            followerId: userData.internalId,
            followedId: userId,
        },
        update: {},
    })
}

export async function unfollowUser(userId: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }

    await db.followUserInteraction.deleteMany({
        where: {
            followerId: userData.internalId,
            followedId: userId,
        },
    });
}

export async function updateBio(bio: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    if (!(await verifySession())) {
        return handleAuthError();
    }
    await db.user.update({
        where: { internalId: userData.internalId },
        data: {
            bio: bio.substring(0, 200),
        }
    });
    return { success: true };
}

export async function updateAvatar(base64Image: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }

    if (!(await verifySession())) {
        return handleAuthError();
    }

    if (!base64Image) {
        return { success: false };
    }

    const base64Data = base64Image.split(',')[1];
    const avatarPath = path.join(process.cwd(), 'public', 'userassets', 'avatars', `${userData.internalId}.jpg`);
    const avatarBuffer = Buffer.from(base64Data, 'base64');

    try {
        await sharp(avatarBuffer)
            .resize(200, 200)
            .jpeg({ mozjpeg: true })
            .toFile(avatarPath);
        return { success: true };
    } catch (error) {
        console.error('Error processing avatar:', error);
    }
}

export async function updateBanner(base64Image: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }

    if (!(await verifySession())) {
        return handleAuthError();
    }

    if (!base64Image) {
        return { success: false };
    }

    const base64Data = base64Image.split(',')[1];
    const bannerPath = path.join(process.cwd(), 'public', 'userassets', 'banners', `${userData.internalId}.jpg`);
    const bannerBuffer = Buffer.from(base64Data, 'base64');

    try {
        await sharp(bannerBuffer)
            .jpeg({ mozjpeg: true })
            .toFile(bannerPath);

        return { success: true };
    } catch (error) {
        console.error('Error processing banner:', error);
    }
}