"use client";
import { updateServerData } from "@/app/(main)/actions";
import { useEffect } from "react";

export function ServerDataUpdaterService() {
    useEffect(() => {
        async function callServerUpdater() {
            await updateServerData();
        }
        callServerUpdater();
    }, []);
    return null;
}