"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Ellipsis, Heart, Loader, Plus, Trash } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DrawerTrigger } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { createPost, deletePost, getNewPosts, getTopPosts, togglePostLike } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDoubleTap } from 'use-double-tap';
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationSection from "@/components/NotificationSection";
import { PermsBadges } from "@/components/PermsBadges";
import Link from "next/link";

export type Post = {
    id: string;
    content: string;
    authorId: string | null;
    feed: string;
    createdAt: Date;
    author: {
        name: string | null;
        permissions: number;
    } | null;
    likes: {
        userId: string;
    }[];
    isLikedByUser: boolean;
    canUserDeletePost: boolean;
}

export default function Page() {
    const [currentTab, setCurrentTab] = useState("new");
    const [posts, setPosts] = useState<Post[]>([]);
    const [parent] = useAutoAnimate();
    async function tryGetNewPosts() {
        const posts = await getNewPosts({ feed: "main" });
        if (posts) {
            setPosts(posts);
        }
    }

    async function tryGetTopPosts() {
        const posts = await getTopPosts({ feed: "main" });
        if (posts) {
            setPosts(posts);
        }
    }

    async function tryUpdate() {
        setPosts([]);
        if (currentTab === "top") {
            await tryGetTopPosts();
        }
        if (currentTab === "new") {
            await tryGetNewPosts();
        }
    }

    useEffect(() => {
        tryGetNewPosts();
    }, []);
    return (
        <div>
            <div>
                <div className="p-4 max-w-3xl mx-auto">
                    <NotificationSection />
                    <Tabs className="w-full z-10" defaultValue="new" value={currentTab} onValueChange={async (value) => {
                        setPosts([]);
                        if (value === "new") {
                            await tryGetNewPosts();
                            setCurrentTab("new");
                        } else {
                            await tryGetTopPosts();
                            setCurrentTab("top");
                        }
                    }}>
                        <div className="sticky top-0 z-10 shadow-xl pb-2 pt-4 bg-background">
                            <div className="flex items-center mb-4 justify-between">
                                <div>
                                    <p className="text-3xl font-semibold">Spotted</p>
                                </div>
                                <Drawer repositionInputs={false} disablePreventScroll={false}>
                                    <DrawerTrigger asChild>
                                        <Button className="pl-2.5 pr-3.5 text-sm" variant={"secondary"}><Plus />Spotta qualcosa</Button>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                        <SpotPostDrawerContent tryUpdatePosts={tryUpdate} />
                                    </DrawerContent>
                                </Drawer>
                            </div>
                            <TabsList className="grid mb-3 w-full grid-cols-2">
                                <TabsTrigger value="new">Nuovi spot</TabsTrigger>
                                <TabsTrigger value="top">Top spot</TabsTrigger>
                            </TabsList>
                        </div>
                        {posts.length === 0 && (
                            <Loader className="mx-auto animate-spin mt-4" />)}
                        <TabsContent ref={parent} value="new" className="gap-6 flex flex-col">
                            {posts && posts.sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((post) => (
                                <SpotEntry key={post.id} post={post} tryUpdatePosts={tryUpdate} />
                            ))}
                            {posts.length >= 99 && (
                                <p className="text-sm text-center opacity-70">Solo gli ultimi 100 spot sono visibili.</p>
                            )}
                        </TabsContent>
                        <TabsContent ref={parent} value="top" className="gap-6 flex flex-col">
                            {posts && posts.sort((a: Post, b: Post) => b.likes.length - a.likes.length).map((post: Post) => (
                                <SpotEntry key={post.id} post={post} tryUpdatePosts={tryUpdate} />
                            ))}
                            {posts.length >= 99 && (
                                <p className="text-sm text-center opacity-70">Solo gli ultimi 100 spot sono visibili.</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

function SpotEntry({ post, tryUpdatePosts }: { post: Post, tryUpdatePosts: () => Promise<void> }) {
    const [isLiked, setLiked] = useState(post.isLikedByUser);
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const likeGesture = useDoubleTap(async () => {
        await tryLike();
    });

    async function tryLike() {
        const newLikedState = !isLiked;
        setLiked(newLikedState);
        setLikeCount(likeCount + (newLikedState ? 1 : -1));
        await togglePostLike({ postId: post.id });
    }

    function formatPublishDate(uploadDate: Date) {
        const now = new Date();
        const upload = new Date(uploadDate);
        const diffMs = now.getTime() - upload.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays < 7) {
            if (diffSec < 60) {
                return `Pubblicato ${diffSec} sec fa`;
            } else if (diffMin < 60) {
                return `Pubblicato ${diffMin} min fa`;
            } else if (diffHours < 24) {
                return `Pubblicato ${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
            } else {
                return `Pubblicato ${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;
            }
        } else {
            return `Pubblicato il ${upload.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })}`;
        }
    }

    return (
        <div {...likeGesture} className="relative p-4 overflow-hidden rounded-xl">
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <div className="border-secondary pb-4 border-b-[0px]">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                        <Avatar className="bg-accent h-[50px] w-[50px]">
                            <AvatarFallback>{post.author?.name ? `${post.author.name[0].toUpperCase()}${post.author.name[1]?.toUpperCase()}` : '?'}</AvatarFallback>
                            <AvatarImage src={`/userassets/avatars/${post.authorId}.jpg`} alt={post.author?.name || "User"} />
                        </Avatar>
                        <div>
                            {post.authorId ? (
                                <Link href={`/app/profile/${post.authorId}`} className="flex items-center gap-1.5">
                                    <p className="font-semibold">@{post.author?.name || "Anonimo"}</p>
                                    <PermsBadges permissions={post.author?.permissions || 0} />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold">@{post.author?.name || "Anonimo"}</p>
                                    <PermsBadges permissions={post.author?.permissions || 0} />
                                </div>
                            )}
                            <p className="text-sm opacity-65">
                                {formatPublishDate(post.createdAt)}
                            </p>
                        </div>

                    </div>
                    <div>
                        {post.canUserDeletePost && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Ellipsis />
                                </PopoverTrigger>
                                <PopoverContent className="relative mr-6 bg-background max-w-[200px] w-auto border-0 p-1">
                                    <Drawer repositionInputs={false} disablePreventScroll={false}>
                                        <DrawerTrigger asChild>
                                            <div className="w-full text-sm text-accent px-2 py-1.5 flex items-center gap-3"><Trash size={16} />Elimina Spot</div>
                                        </DrawerTrigger>
                                        <DrawerContent>
                                            <div className="mx-auto w-full max-w-sm">
                                                <DrawerHeader>
                                                    <DrawerTitle className="text-2xl max-w-[75%] mx-auto text-center">Sei sicuro di voler eliminare questo spot?</DrawerTitle>
                                                    <DrawerDescription className="opacity-50 text-center">Perderai tutti e {post.likes.length} like</DrawerDescription>
                                                </DrawerHeader>
                                                <DrawerFooter className="mt-8 mb-4 grid grid-rows-1 grid-cols-2">
                                                    <DrawerClose className="flex-1 flex-shrink-0" asChild>
                                                        <Button className="w-full" variant={"outline"}>Annulla</Button>
                                                    </DrawerClose>
                                                    <Button className="flex-1 flex-shrink-0" onClick={async () => {
                                                        await deletePost({ postId: post.id });
                                                        await tryUpdatePosts();
                                                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                                    }}>Elimina</Button>
                                                </DrawerFooter>
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>

                <p className="text-lg mt-4 whitespace-pre-line">{post.content}</p>
            </div>
            <div>
                <div className="flex items-center justify-start gap-4">
                    <div onClick={async () => {
                        await tryLike();
                    }} className="flex opacity-80 items-center gap-1.5">
                        <Heart className="transition-all" stroke={isLiked ? "var(--accent)" : "white"} fill={isLiked ? "var(--accent)" : "transparent"} />
                        <span className="text-sm">{likeCount}</span>
                    </div>
                </div>
            </div>
        </div >
    )
}

function SpotPostDrawerContent({ tryUpdatePosts }: { tryUpdatePosts: () => Promise<void> }) {
    const [text, setText] = useState("");
    const [isAnon, setAnon] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function updatePosts() {
        await tryUpdatePosts();
    }
    return (
        <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
                <DrawerTitle className="text-2xl">Crea un nuovo spot</DrawerTitle>
                <DrawerDescription className="opacity-50">Spotta qualcosa o qualcuno</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pt-0 pb-0">
                <div className="w-full rounded-md border border-accent overflow-hidden relative mt-4">
                    <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                    <Textarea
                        className="border-none max-h-[200px] min-h-[100px] resize-none placeholder:text-secondary"
                        placeholder="Spotto..."
                        autoFocus
                        value={text}
                        onInput={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                            const newText = e.currentTarget.value.replace(/\n{2,}/g, '\n');
                            if (newText.length <= 500) {
                                setText(newText);
                            }
                        }}
                    />
                </div>
                {text.length > 450 && (
                    <div className="text-sm text-secondary text-right">{text.length}/500</div>
                )}
                <div>
                    <div className="flex items-center justify-between mt-4 space-x-2">
                        <div className="flex flex-col">
                            <span className="font-semibold">Pubblica lo spot come anonimo</span>
                            <span className="text-sm opacity-65">Non sarai in grado di eliminarlo in futuro!</span>
                        </div>
                        <Switch onCheckedChange={setAnon} checked={isAnon} />
                    </div>
                </div>
            </div>
            <DrawerFooter className="mt-8 mb-4">
                {error && (
                    <div className="text-sm text-red-500 mt-2">{error}</div>
                )}
                <Button onClick={async () => {
                    if (!loading) {
                        setLoading(true);
                        const error = await createPost({ content: text, isAnon });
                        if (error) {
                            setError(error);
                            setTimeout(() => setError(null), 5000);
                            setLoading(false);
                            return;
                        }
                        await updatePosts();
                        setLoading(false);
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }}>
                    {loading ? <Loader className="animate-spin" /> : isAnon ? "Pubblica come anonimo" : "Pubblica"}
                </Button>
            </DrawerFooter>
        </div>
    );
}