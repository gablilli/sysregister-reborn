"use client";
import { useParams } from "next/navigation";
import { ProfilePage } from "../ProfilePage";

export default function Page() {
    const userId = useParams().userId;
    return <ProfilePage userId={userId as string}/>;
}