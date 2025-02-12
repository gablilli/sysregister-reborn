"use server";

import { verifySession } from "@/app/(auth)/auth/actions";
import { handleAuthError } from "@/lib/api";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function createPost({ content, feed, isAnon }: { content: string, feed?: string, isAnon?: boolean }) {
    try {
        if (!(await verifySession())) {
            return handleAuthError();
        }
        if (!content) {
            return "Lo spot non puó essere vuoto";
        }
        if (content.length > 500) {
            return "Lo spot puó contenere al massimo 500 caratteri";
        }
        if (!feed) {
            feed = "main";
        }
        let authorId: string | null = cookies().get("internal_id")?.value as string;
        if (isAnon) {
            authorId = null;
        }
        await db.post.create({
            data: {
                content,
                feed,
                authorId,
            }
        });
        return;
    } catch {
        return handleAuthError();
    }
}

export async function getPosts({ feed }: { feed?: string }) {
    try {
        if (!(await verifySession())) {
            return handleAuthError();
        }
        if (!feed) {
            feed = "main";
        }
        const posts = await db.post.findMany({
            where: {
                feed,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        name: true,
                    },
                },
                likes: {
                    select: {
                        userId: true,
                    },
                }
            },
        });
        const userId = cookies().get("internal_id")?.value as string;
        const postsWithLikes = posts.map(post => ({
            ...post,
            isLikedByUser: post.likes.some(like => like.userId === userId),
            isPostMadeByUser: post.authorId === userId,
        }));
        return postsWithLikes;
    } catch {
        return handleAuthError();
    }
}

export async function togglePostLike({ postId }: { postId: string }) {
    try {
        if (!(await verifySession())) {
            return handleAuthError();
        }
        const userId = cookies().get("internal_id")?.value as string;
        const post = await db.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                likes: {
                    where: {
                        userId,
                    },
                },
            },
        });
        if (post?.likes.length) {
            await db.post.update({
                where: {
                    id: postId,
                },
                data: {
                    likes: {
                        deleteMany: {
                            userId,
                        },
                    },
                },
            });
        } else {
            await db.post.update({
                where: {
                    id: postId,
                },
                data: {
                    likes: {
                        create: {
                            userId,
                        },
                    },
                },
            });
        }
        return;
    } catch {
        return handleAuthError();
    }
}

export async function deletePost({ postId }: { postId: string }) {
    try {
        if (!(await verifySession())) {
            return handleAuthError();
        }
        const userId = cookies().get("internal_id")?.value as string;
        await db.postLikeInteraction.deleteMany({
            where: {
                postId,
            },
        });
        await db.post.delete({
            where: {
                id: postId,
                authorId: userId,
            }
        });
        return;
    } catch (e) {
        console.log(e);
        return handleAuthError();
    }
}
