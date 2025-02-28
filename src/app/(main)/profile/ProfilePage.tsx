import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUp, Loader, MonitorUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { followUser, getUserData, unfollowUser, updateAvatar, updateBanner, updateBio } from "./actions";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTrigger } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { PermsBadges } from "@/components/PermsBadges";
import Image from "next/legacy/image";
import { usePathname } from "next/navigation";
import { DialogTitle } from "@radix-ui/react-dialog";
import posthog from "posthog-js";

type InternalUserData = {
    internalId: string | null;
    lastServerDataUpdate: Date;
    name: string | null;
    school: string | null;
    average: number | null;
    absencesHours: number | null;
    delays: number | null;
    permissions: number;
    bio: string | null;
    likeCount: number | null;
    averageRank: number | null;
    absencesRank: number | null;
    delaysRank: number | null;
    followCount: number | null;
    isFollowed: boolean | null;
};

export function ProfilePage({ userId }: { userId?: string }) {
    const path = usePathname();
    const [userData, setUserData] = useState<InternalUserData | null>(null);

    const fetchUserData = useCallback(async () => {
        const user = (await getUserData(userId)) || null;
        if (user) {
            setUserData({
                internalId: user.internalId ?? null,
                lastServerDataUpdate: user.lastServerDataUpdate ?? new Date(),
                name: user.name ?? null,
                school: user.school ?? null,
                average: user.average ?? null,
                absencesHours: user.absencesHours ?? null,
                delays: user.delays ?? null,
                permissions: user.permissions ?? 0,
                bio: user.bio ?? null,
                likeCount: user.likeCount ?? null,
                averageRank: user.averageRank ?? null,
                absencesRank: user.absencesRank ?? null,
                delaysRank: user.delaysRank ?? null,
                followCount: user.followCount ?? null,
                isFollowed: user.isFollowed ?? false,
            });
        }
    }, [userId]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    if (!userData) {
        return (
            <Loader className="mx-auto animate-spin mt-4" />
        )
    }

    if (userData.internalId === null) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="h-[150px] relative">
                <Image
                    src={`/userassets/banners/${userData.internalId}.jpg?time=${new Date().toISOString()}`}
                    layout="fill"
                    objectFit="cover"
                    alt="banner"
                    priority
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-40 -z-10" />
            </div>
            <div className="px-4 -translate-y-1/2 flex items-center justify-between">
                <Avatar className="outline-offset-1 ml-1 outline bg-accent outline-accent h-[100px] w-[100px]">
                    <AvatarFallback className="text-2xl">{userData?.name ? `${userData.name[0].toUpperCase()}${userData.name[1]?.toUpperCase()}` : "NA"}</AvatarFallback>
                    <AvatarImage src={`/userassets/avatars/${userData.internalId}.jpg?time=${new Date().toISOString()}`} alt={userData.name ?? "User"} />
                </Avatar>
                <div className="flex items-center gap-1">
                    {path === "/profile" ? (
                        <UpdateButton user={userData} updateProfile={fetchUserData} />
                    ) : (
                        <FollowButton user={userData} setUser={setUserData} isFollowed={userData.isFollowed || false} />
                    )}
                    {/* <div className="bg-background rounded-full overflow-hidden p-1">
              <Button variant={"secondary"} className="rounded-full"><Cog /></Button>
            </div> */}
                </div>
                <span className="absolute right-0 mr-5 top-[80%] truncate text-sm"><b>{userData.likeCount}</b> like <span className="opacity-50 text-accent px-1">•</span> <b>{userData.followCount}</b> followers</span>
            </div>
            <div className="px-4 -translate-y-[35px] overflow-x-hidden">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-semibold">
                            @{userData.name}
                        </p>
                        <PermsBadges permissions={userData.permissions} />
                    </div>
                    <p className="text-base opacity-50 max-w-[70%] whitespace-pre-line">{userData.school}</p>
                    <div className="mt-4 relative rounded-lg overflow-hidden whitespace-pre-line p-2 px-3">
                        <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-40 -z-10" />
                        <p className="font-semibold text-sm">Bio</p>
                        <p className="whitespace-pre-line opacity-80">
                            {userData.bio ? userData.bio : <span className="italic opacity-50 font-semibold">{path === "/profile" ? (
                                "Non hai ancora impostato una bio."
                            ) : (
                                "L'utente non ha una bio."
                            )}</span>}
                        </p>
                    </div>
                    <div className="mt-4 relative rounded-lg overflow-hidden whitespace-pre-line p-2 px-3">
                        <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-40 -z-10" />
                        <p className="font-semibold text-sm">Classifiche</p>
                        <div className="grid grid-cols-3 my-4 grid-rows-1">
                            <div className="flex flex-col items-center">
                                <p className="text-sm text-accent">Media</p>
                                <p className="font-semibold text-xl">#{userData.averageRank}</p>
                                <p className="opacity-60 text-sm">({userData.average?.toFixed(3)})</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-sm text-accent">Ritardi</p>
                                <p className="font-semibold text-xl">#{userData.delaysRank}</p>
                                <p className="opacity-60 text-sm">({userData.delays?.toFixed(0) || 0} {" "}
                                    {userData.delays !== undefined && (
                                        <>
                                            {userData.delays === 1 ? "ritardo" : "ritardi"}
                                        </>
                                    )})</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-sm text-accent">Assenze</p>
                                <p className="font-semibold text-xl">#{userData.absencesRank}</p>
                                <p className="opacity-60 text-sm">({userData.absencesHours?.toFixed(0) || 0} {" "}
                                    {userData.absencesHours !== undefined && (
                                        <>
                                            {userData.absencesHours === 1 ? "ora" : "ore"}
                                        </>
                                    )})</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    {/*  <Tabs className="w-full z-10" defaultValue="new">
                        <div className="sticky top-0 z-10 shadow-xl pb-2 pt-4 bg-background">
                            <div className="flex items-center mb-2 justify-between">
                                <div>
                                    <p className="text-xl font-semibold">Spot dell&apos;utente (12)</p>
                                </div>
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
                    </Tabs> */}
                </div>

            </div>
        </div>
    )
}

function FollowButton({ user, setUser, isFollowed }: { user: InternalUserData, setUser: React.Dispatch<React.SetStateAction<InternalUserData | null>>, isFollowed: boolean }) {
    const [optimisticFollow, setOptimisticFollow] = useState(isFollowed);
    return (
        <div className="bg-background rounded-full overflow-hidden p-1">
            {!optimisticFollow ? (
                <Button variant={"secondary"} className="rounded-full" onClick={() => {
                    setOptimisticFollow(true);
                    followUser(user.internalId || "");
                    setUser((prev) => {
                        if (prev) {
                            return {
                                ...prev,
                                followCount: prev.followCount ? prev.followCount + 1 : 1,
                                isFollowed: true,
                            }
                        }
                        return prev;
                    });
                }}>Segui</Button>) : (
                <Button variant={"secondary"} className="rounded-full opacity-80" onClick={() => {
                    setOptimisticFollow(false);
                    unfollowUser(user.internalId || "");
                    setUser((prev) => {
                        if (prev) {
                            return {
                                ...prev,
                                followCount: prev.followCount ? prev.followCount - 1 : 0,
                                isFollowed: false,
                            }
                        }
                        return prev;
                    });
                }}>Smetti di seguire</Button>)}
        </div>
    )
}

function UpdateButton({ user, updateProfile }: { user: InternalUserData, updateProfile: () => Promise<void> }) {
    const [banner, setBanner] = useState(`/userassets/banners/${user.internalId}.jpg?time=${new Date().toISOString()}`);
    const [avatar, setAvatar] = useState(`/userassets/avatars/${user.internalId}.jpg?time=${new Date().toISOString()}`);
    const [bio, setBio] = useState(user.bio);
    const [loading, setLoading] = useState(false);

    async function tryUpdateBio() {
        await updateBio(bio || "");
    }
    async function tryUpdateAvatar() {
        await updateAvatar(avatar);
    }
    async function tryUpdateBanner() {
        await updateBanner(banner);
    }
    return (
        <Drawer repositionInputs={false} disablePreventScroll={false}>
            <DrawerTrigger asChild>
                <div className="bg-background rounded-full overflow-hidden p-1">
                    <Button variant={"secondary"} className="rounded-full">Modifica Profilo</Button>
                </div>
            </DrawerTrigger>
            <DrawerContent aria-describedby="">
                <DialogTitle className="hidden">Cassetto di modifica del profilo</DialogTitle>
                <div className="max-w-3xl mx-auto w-full">
                    <DrawerHeader className="pt-0">
                        <p className="text-xl font-semibold text-center">Modifica il tuo profilo</p>
                    </DrawerHeader>
                    <div className="px-4 max-h-[70svh] overflow-y-auto   flex flex-col gap-12">
                        <div>
                            <p className="font-semibold mb-2">Avatar & Banner</p>
                            <div className="px-0 mx-auto overflow-hidden">
                                <div className="h-[150px] relative rounded-t-lg overflow-hidden">
                                    <Image
                                        key={banner}
                                        src={banner as string}
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-t-lg"
                                        alt="banner"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-40 -z-10" />
                                </div>
                                <div className="relative">
                                    <div className="px-2 -translate-y-1/2 flex items-center justify-between">
                                        <Avatar className="outline-offset-1 ml-2 outline bg-accent outline-accent h-[100px] w-[100px]">
                                            <AvatarFallback className="text-2xl">SY</AvatarFallback>
                                            <AvatarImage key={avatar} src={avatar} alt={user.name ?? "User"} />
                                        </Avatar>
                                    </div>
                                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-10 rounded-b-lg -z-10" />
                                    <div className="-translate-y-1/2 h-full px-4">
                                        <div className="flex flex-col -translate-y-[5px] h-full">
                                            <div className="flex items-center gap-2">
                                                <p className="text-2xl font-semibold">
                                                    {user.name}
                                                </p>
                                                <PermsBadges permissions={user.permissions} />
                                            </div>
                                            <p className="text-base opacity-50 whitespace-pre-line">{user.school}</p>
                                        </div></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 grid-rows-2 mt-4 gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    name="banner-image"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                setBanner(event.target?.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <Button variant="secondary" className="whitespace-pre-line" onClick={() => {
                                    (document.querySelector('input[name="banner-image"]') as HTMLInputElement)?.click();
                                }}><MonitorUp />Carica nuovo banner</Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    name="avatar-image"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                setAvatar(event.target?.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <Button variant="secondary" className="whitespace-pre-line" onClick={() => {
                                    (document.querySelector('input[name="avatar-image"]') as HTMLInputElement)?.click();
                                }}><ImageUp />Carica nuova immagine profilo</Button>

                            </div>
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Bio</p>
                            <div className="w-full rounded-md border border-accent overflow-hidden relative">
                                <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                                <Textarea
                                    className="border-none max-h-[200px] min-h-[100px] resize-none placeholder:text-secondary"
                                    placeholder="Inserisci una bio..."
                                    value={bio || ""}
                                    onInput={(e) => {
                                        e.currentTarget.style.height = "auto";
                                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                        setBio(e.currentTarget.value);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <DrawerFooter className="mb-3 mt-4">
                        <Button onClick={async () => {
                            try {
                                setLoading(true);
                                if (user.bio !== bio) {
                                    await tryUpdateBio();
                                }
                                if (!avatar.startsWith(`/userassets/avatars/${user.internalId}.jpg`)) {
                                    await tryUpdateAvatar();
                                }
                                if (!banner.startsWith(`/userassets/banners/${user.internalId}.jpg`)) {
                                    await tryUpdateBanner();
                                }
                                await updateProfile();
                                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                setLoading(false);
                            } catch (e) {
                                posthog.captureException(e);
                                setLoading(false);
                            }
                        }}>
                            {loading ? <Loader className="animate-spin" /> : "Salva"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant={"ghost"} className="w-full">
                                Chiudi
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}