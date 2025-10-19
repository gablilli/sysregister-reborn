"use client";
import { Notification } from "@/lib/types";
import { useEffect, useState } from "react";
import { getAllNotifications, setNotificationAsRead } from "@/app/(app)/app/actions";
import { BellDot, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function NotificationSection() {
    const [parent] = useAutoAnimate();
    const [notifications, setNotifications] = useState<Notification[]>();
    useEffect(() => {
        async function fetchNotifications() {
            const readNotifications = JSON.parse(window.localStorage.getItem("read_notifications") || "[]");
            setNotifications(JSON.parse(window.sessionStorage.getItem("notifications") || "[]").filter((notification: Notification) => !readNotifications.includes(notification.id)));
            const notifications = await getAllNotifications();
            if (notifications === null) {
                // Auth error - redirect to login
                window.location.href = "/";
                return;
            }
            if (notifications && notifications.length > 0) {
                const unreadNotifications = notifications.filter(notification => !readNotifications.includes(notification.id));
                setNotifications(unreadNotifications);
                window.sessionStorage.setItem("notifications", JSON.stringify(unreadNotifications));
            }
        }
        fetchNotifications();
    }, []);
    async function tryReadNotification(id: string) {
        const result = await setNotificationAsRead({ notificationId: id });
        if (result === null) {
            // Auth error - redirect to login
            window.location.href = "/";
            return;
        }
        const readNotifications = JSON.parse(window.localStorage.getItem("read_notifications") || "[]");
        readNotifications.push(id);
        setNotifications((prevNotifications) => prevNotifications?.filter(notification => notification.id !== id));
        window.localStorage.setItem("read_notifications", JSON.stringify(readNotifications));
    }
    if (notifications?.length === 0 || !notifications) {
        return null;
    }
    if (notifications.length === 1) {
        return (
            <Drawer onClose={() => tryReadNotification(notifications[0].id)}>
                <DrawerTrigger className="w-full text-left">
                    <div
                        className="rounded-xl overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between"
                        ref={parent}
                    >
                        <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                        <div className="flex items-center gap-4">
                            <BellDot />
                            <div>
                                <p className="text-text font-semibold text-md">
                                    Nuova notifica da leggere
                                </p>
                                <p className="opacity-60 text-primary text-sm">
                                    {notifications[0].title}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="text-secondary" />
                    </div>
                </DrawerTrigger>
                <NotificationDrawer notification={notifications[0]} />
            </Drawer>
        )
    }



    // will be shown in the future
    return (
        <Link
            href={`/app/notifications`}
            className="rounded-xl overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between"
        >
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <div className="flex items-center gap-4">
                <BellDot />
                <div>
                    <p className="text-text font-semibold text-md">
                        Nuove notifiche da leggere
                    </p>
                    <p className="opacity-60 text-primary text-sm">
                        {notifications?.length} notific{notifications.length === 1 ? "a" : "he"} da leggere
                    </p>
                </div>
            </div>

            <ChevronRight className="text-secondary" />
        </Link>
    )
}

function NotificationDrawer({ notification }: { notification: Notification }) {
    return (
        <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="mb-8">
                    <DrawerTitle className="text-lg font-semibold leading-6">{notification.title}
                    </DrawerTitle>
                    <DrawerDescription className="font-normal text-sm opacity-65 mt-2 whitespace-pre-line">{notification?.content}</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="mb-4">
                    {notification.link && (<Link href={notification.link}><Button className="w-full">{notification.linkTitle ? notification.linkTitle : notification.link}</Button></Link>)}
                    {notification.link ? <DrawerClose className="w-full pt-1.5 text-sm">
                        Chiudi
                    </DrawerClose> : <DrawerClose asChild>
                        <Button>Ok, chiudi</Button>
                    </DrawerClose>}
                </DrawerFooter>
            </div>
        </DrawerContent>
    )
}
