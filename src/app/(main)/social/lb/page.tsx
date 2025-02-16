"use client";
import { useEffect, useState } from "react";
import { getLeaderboard } from "./actions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { useRouter } from "next/navigation";
import { hasUserAcceptedSocialTerms, revokeSocialTerms } from "../actions";
import { Button } from "@/components/ui/button";

type LeaderboardEntryType = {
    name: string;
    average: number;
    absenceHours: number;
    delaysNumber: number;
    isRequestingUser: boolean;
}

export default function Page() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntryType[]>();
    useEffect(() => {
        async function getLeaderboardData() {
            const lb: LeaderboardEntryType[] = (await getLeaderboard()) as LeaderboardEntryType[];
            setLeaderboard(lb);
        }
        getLeaderboardData();
    }, [])
    return (
        <div>
            <SocialTermsDrawer />
            <div className="p-4 max-w-3xl mx-auto">
                <Tabs className="w-full" defaultValue="media">
                    <div className="sticky top-0 z-10 shadow-xl pb-2 pt-4 bg-background">
                        <p className="text-3xl mb-2 font-semibold">Classifiche</p>
                        <TabsList className="grid mb-2 w-full grid-cols-3">
                            <TabsTrigger value="media">Media</TabsTrigger>
                            <TabsTrigger value="delays">Ritardi</TabsTrigger>
                            <TabsTrigger value="absences">Assenze</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="media" className="gap-2 flex flex-col">
                        {leaderboard?.sort((a, b) => b.average - a.average).map((entry, index) => (
                            <LeaderboardEntry key={index} rank={index + 1} name={entry.name} precision={3} value={entry.average} isRequestingUser={entry.isRequestingUser} />
                        ))}
                    </TabsContent>
                    <TabsContent value="delays" className="gap-2 flex flex-col">
                        {leaderboard?.sort((a, b) => b.delaysNumber - a.delaysNumber).map((entry, index) => (
                            <LeaderboardEntry key={index} rank={index + 1} name={entry.name} singleLabel="ritardo" label="ritardi" value={entry.delaysNumber} isRequestingUser={entry.isRequestingUser} />
                        ))}
                    </TabsContent>
                    <TabsContent value="absences" className="gap-2 flex flex-col">
                        {leaderboard?.sort((a, b) => b.absenceHours - a.absenceHours).map((entry, index) => (
                            <LeaderboardEntry key={index} rank={index + 1} name={entry.name} label="ore" value={entry.absenceHours} isRequestingUser={entry.isRequestingUser} />
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function LeaderboardEntry({ rank, name, value, precision, singleLabel, label, isRequestingUser }: { rank: number, name: string, value: number, singleLabel?: string, precision?: number, label?: string, isRequestingUser?: boolean }) {
    return (
        <div className={`flex min-h-[50px] ${isRequestingUser ? "border-2 border-accent" : ""} items-center relative overflow-hidden rounded-xl p-2 pr-4 justify-between`}>
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <div className="flex items-center gap-4">
                <div className="min-w-[40px] text-lg text-accent text-center font-semibold">
                    #{rank}
                </div>

                <div className="truncate">
                    @{name}
                </div>
            </div>
            <div className="font-semibold">
                {value === 0 || !value ? '-' : value?.toFixed(precision || 0)} {" "}
                {value !== 0 && value && (
                    <>
                        {value !== 1 && label}
                        {value === 1 && singleLabel ? singleLabel : ""}
                    </>
                )}

            </div>
        </div>
    )
}


function SocialTermsDrawer() {
    const router = useRouter();
    const [hasUserAcceptedTerms, setHasUserAcceptedTerms] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        async function getUserDecision() {
            setLoading(true);
            const userDecision = window.localStorage.getItem("social_terms_accepted");
            if (userDecision === "true") {
                setHasUserAcceptedTerms(true);
                setLoading(false);
                return;
            };
            setHasUserAcceptedTerms(await hasUserAcceptedSocialTerms() as boolean);
            const userAccepted = await hasUserAcceptedSocialTerms();
            if (typeof userAccepted === "boolean") {
                window.localStorage.setItem("social_terms_accepted", userAccepted.toString());
            }
            setLoading(false);
        }
        getUserDecision();
    }, []);
    if (loading) {
        return null;
    }
    if (hasUserAcceptedTerms) {
        return (
            <div className="bg-yellow-500 text-background">
                <div className="max-w-3xl mx-auto p-4">
                    <div>
                        <p className="font-semibold ">Stai partecipando alla classifica generale</p>
                        <p className="text-sm">Mentre partecipi la tua media, numero di ritardi, assenze e numero di note sono visibili a tutti.</p>
                    </div>
                    <Button onClick={async () => {
                        await revokeSocialTerms();
                        window.localStorage.setItem("social_terms_accepted", "false");
                        router.push("/");
                    }} variant={"default"} className="bg-red-700 font-semibold mt-4 hover:bg-red-600 text-white">Revoca autorizzazione dati</Button>
                </div>
            </div>
        )
    }
    return null;
}