"use client";
import { useEffect, useState } from "react";
import { getLeaderboard } from "./actions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import Wip from "@/components/Wip";

type LeaderboardEntryType = {
    name: string;
    average: number;
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
        <div className="p-4">
            <Tabs className="w-full" defaultValue="media">
                <div className="sticky top-0 z-10 shadow-xl pb-2 pt-4 bg-background">
                    <p className="text-3xl mb-2 font-semibold">Classifiche</p>
                    <TabsList className="grid mb-2 w-full grid-cols-4">
                        <TabsTrigger value="media">Media</TabsTrigger>
                        <TabsTrigger value="delays">Ritardi</TabsTrigger>
                        <TabsTrigger value="absences">Assenze</TabsTrigger>
                        <TabsTrigger value="note">Note</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="media" className="gap-2 flex flex-col">
                    {leaderboard?.map((entry, index) => (
                        <LeaderboardEntry key={index} rank={index + 1} name={entry.name} value={entry.average} />
                    ))}
                </TabsContent>
                <TabsContent value="delays">
                    <Wip />
                </TabsContent>
                <TabsContent value="absences">
                    <Wip />
                </TabsContent>
                <TabsContent value="note">
                    <Wip />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function LeaderboardEntry({rank, name, value}: {rank?: number, name?: string, value?: number}) {
    return (
        <div className="flex min-h-[50px] items-center relative overflow-hidden rounded-xl p-2 pr-4 justify-between">
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <div className="flex items-center gap-4">
                <div className="min-w-[40px] text-lg text-accent text-center font-semibold">
                    #{rank}
                </div>

                <div className="truncate">
                    {name}
                </div>
            </div>
            <div className="font-semibold">
                {value === 0 ? '-' : value}
            </div>
        </div>
    )
}