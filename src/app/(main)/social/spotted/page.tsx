"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Ellipsis, Heart, Loader, Plus, Trash } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DrawerTrigger } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { createPost, deletePost, getPosts, togglePostLike } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDoubleTap } from 'use-double-tap';
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type Post = {
    id: string;
    content: string;
    authorId: string | null;
    feed: string;
    createdAt: Date;
    author: {
        name: string | null;
    } | null;
    likes: {
        userId: string;
    }[];
    isLikedByUser: boolean;
    isPostMadeByUser: boolean;
}

export default function Page() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [parent] = useAutoAnimate();
    async function tryGetPosts() {
        const sessionPosts = window.sessionStorage.getItem("posts");
        if (sessionPosts) {
            setPosts(JSON.parse(sessionPosts));
        } else {
            const posts = await getPosts({ feed: "main" });
            if (posts) {
                setPosts(posts);
                window.sessionStorage.setItem("posts", JSON.stringify(posts));
            }
        }
        window.addEventListener("beforeunload", () => {
            window.sessionStorage.removeItem("posts");
        });
    }

    useEffect(() => {
        tryGetPosts();
    }, []);
    return (
        <div>
            <div>
                <div className="p-4 max-w-3xl mx-auto">
                    <Tabs className="w-full z-10" defaultValue="new">
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
                                        <SpotPostDrawerContent setPosts={setPosts} />
                                    </DrawerContent>
                                </Drawer>
                            </div>
                            <TabsList className="grid mb-3 w-full grid-cols-2">
                                <TabsTrigger value="new">Nuovi spot</TabsTrigger>
                                <TabsTrigger value="top">Top spot</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent ref={parent} value="new" className="gap-6 flex flex-col">
                            {posts && posts.sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((post) => (
                                <SpotEntry key={post.id} post={post} setPosts={setPosts} postArray={posts} />
                            ))}
                            {posts.length >= 99 && (
                                <p className="text-sm text-center opacity-70">Solo gli ultimi 100 spot sono visibili.</p>
                            )}
                        </TabsContent>
                        <TabsContent ref={parent} value="top" className="gap-6 flex flex-col">
                            {posts && posts.sort((a: Post, b: Post) => b.likes.length - a.likes.length).map((post: Post) => (
                                <SpotEntry key={post.id} post={post} setPosts={setPosts} postArray={posts} />
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

function SpotEntry({ post, setPosts, postArray }: { post: Post, setPosts: (posts: Post[]) => void, postArray: Post[] }) {
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

        // Update the global posts variable
        const updatedPosts = postArray.map(p =>
            p.id === post.id ? { ...p, isLikedByUser: newLikedState, likes: newLikedState ? [...p.likes, { userId: "currentUserId" }] : p.likes.filter(like => like.userId !== "currentUserId") } : p
        );
        setPosts(updatedPosts);
        window.sessionStorage.setItem("posts", JSON.stringify(updatedPosts));
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
                        </Avatar>
                        <div>
                            <p className="font-semibold">@{post.author?.name || "Anonimo"}</p>
                            <p className="text-sm opacity-65">
                                {formatPublishDate(post.createdAt)}
                            </p>
                        </div>
                    </div>
                    <div>
                        {post.isPostMadeByUser && (
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
                                            <DrawerHeader>
                                                <DrawerTitle className="text-2xl max-w-[75%] mx-auto">Sei sicuro di voler eliminare questo spot?</DrawerTitle>
                                                <DrawerDescription className="opacity-50">Perderai tutti e {post.likes.length} like</DrawerDescription>
                                            </DrawerHeader>
                                            <DrawerFooter className="mt-8 mb-4 grid grid-rows-1 grid-cols-2">
                                                <DrawerClose className="flex-1 flex-shrink-0">
                                                    <Button className="w-full" variant={"outline"}>Annulla</Button>
                                                </DrawerClose>
                                                <Button className="flex-1 flex-shrink-0" onClick={async () => {
                                                    const updatedPosts = postArray.filter(p => p.id !== post.id);
                                                    setPosts(updatedPosts);
                                                    await deletePost({ postId: post.id });
                                                }}>Elimina</Button>
                                            </DrawerFooter>
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
        </div>
    )
}

function SpotPostDrawerContent({ setPosts }: { setPosts: (posts: Post[]) => void }) {
    const [text, setText] = useState("");
    const [isAnon, setAnon] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function updatePosts() {
        const posts = await getPosts({ feed: "main" });
        if (posts) {
            setPosts(posts);
            window.sessionStorage.setItem("posts", JSON.stringify(posts));
        }
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
                }}>
                    {loading ? <Loader className="animate-spin" /> : isAnon ? "Pubblica come anonimo" : "Pubblica"}
                </Button>
            </DrawerFooter>
        </div>
    )
}