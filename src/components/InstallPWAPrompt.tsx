import { Check, Download } from "lucide-react";
import React, { useEffect, useState } from "react";
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
import addToHomeImage from "@/assets/addToHome.jpg";
import Image from "next/image";

type BeforeInstallPromptEvent = Event & {
    prompt: () => void;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallPWAPrompt() {
    const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
    const [supportsPWA, setSupportsPWA] = useState<boolean>(false);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [platform, setPlatform] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsInstalled(localStorage.getItem("isInstalled") === "true");
        }
    }, []);
    
    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/android/.test(userAgent)) {
            setPlatform("android");
        } else if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform("ios");
        } else {
            setPlatform("desktop");
        }
    }, []);

    useEffect(() => {
        if (isInstalled) {
            return;
        }
        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        window.addEventListener("beforeinstallprompt", (e) => { handler(e as BeforeInstallPromptEvent) });
        return () => window.removeEventListener("beforeinstallprompt", (e) => { handler(e as BeforeInstallPromptEvent) });
    }, [isInstalled]);

    const onClick = async (evt: React.MouseEvent<HTMLButtonElement>) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
        if ((await promptInstall.userChoice).outcome === "accepted") {
            setIsInstalled(true);
            localStorage.setItem("isInstalled", "true");
        }
    };
    if (isInstalled) {
        return null;
    }
    if (supportsPWA) {
        return (
            <button
                onClick={onClick}
                className="rounded-xl w-full overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between bg-purple-600 hover:bg-purple-700 text-white"
            >
                <div className="bg-purple-700 -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                <div>
                    <p className="font-semibold text-md">
                        Installa l&apos;applicazione!
                    </p>
                    <p className="opacity-80 text-left text-sm">
                        Clicca per installare
                    </p>
                </div>
                <Download className="text-white" />
            </button>
        );
    }

    if (platform === "ios") {
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    <button
                        className="rounded-xl w-full overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <div className="bg-purple-700 -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                        <div>
                            <p className="font-semibold text-md">
                                Installa l&apos;applicazione!
                            </p>
                            <p className="opacity-80 text-left text-sm">
                                Clicca per installare
                            </p>
                        </div>
                        <Download className="text-white" />
                    </button>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle className="text-2xl font-semibold">Installa l&apos;applicazione su iOS</DrawerTitle>
                            <DrawerDescription>É semplice, segui questi passaggi.</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 mb-8 pb-0">
                            <div className="mt-3">
                                <div className="h-[40svh] flex flex-col gap-4 overflow-y-auto">
                                    <div>
                                        <div className="flex items-start mb-2 text-sm gap-2">
                                            <div className="w-8 text-lg mt-0.5 flex-shrink-0 h-8 bg-accent border-gray-200 font-semibold shadow text-white flex items-center justify-center rounded-lg">
                                                1
                                            </div>
                                            <p className="text-text opacity-90">
                                                Trova questa icona nella barra del tuo browser e cliccaci sopra. (su safari la trovi in fondo allo schermo)</p>
                                        </div>
                                        <div className="bg-secondary rounded-xl flex items-center justify-center h-[160px]">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="var(--text)" width="100px" height="100px" viewBox="0 0 50 50"><path d="M30.3 13.7L25 8.4l-5.3 5.3-1.4-1.4L25 5.6l6.7 6.7z" /><path d="M24 7h2v21h-2z" /><path d="M35 40H15c-1.7 0-3-1.3-3-3V19c0-1.7 1.3-3 3-3h7v2h-7c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V19c0-.6-.4-1-1-1h-7v-2h7c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3z" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-start mb-2 text-sm gap-2">
                                            <div className="w-8 text-lg mt-0.5 flex-shrink-0 h-8 bg-accent border-gray-200 font-semibold shadow text-white flex items-center justify-center rounded-lg">
                                                2
                                            </div>
                                            <p className="text-text opacity-90">
                                                Ora uscirà il popup per condividere, scorri in basso fino a trovare &quot;Aggiungi a schermata home&quot;, safari si chiuderà e ti porterà alla home, trova l&apos;app di SysRegister e cliccaci sopra, una volta aperta clicca di nuovo su installa app.</p>
                                        </div>
                                        <div className="bg-secondary rounded-xl flex items-center justify-center border-2 border-accent overflow-hidden">
                                            <Image src={addToHomeImage} alt="Aggiungi a schermata home" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-start mb-2 text-sm gap-2">
                                            <div className="w-8 text-lg mt-0.5 flex-shrink-0 h-8 bg-accent border-gray-200 font-semibold shadow text-white flex items-center justify-center rounded-lg">
                                                3
                                            </div>
                                            <p className="text-text opacity-90">
                                                Ecco fatto! ora hai l&apos;app installata nel tuo dispositivo. Per completare clicca il pulsante &quot;Fatto, chiudi&quot;.</p>
                                        </div>
                                        <div className="bg-secondary rounded-xl flex items-center justify-center h-[160px] overflow-hidden">
                                            <Check size={70} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DrawerFooter>
                            <div className="grid grid-rows-2 grid-cols-1 w-full items-center gap-2">
                                <DrawerClose asChild onClick={() => {
                                    setIsInstalled(true);
                                    localStorage.setItem("isInstalled", "true");
                                }}>
                                    <Button>
                                        Fatto, chiudi
                                    </Button>
                                </DrawerClose>
                                <DrawerClose asChild>
                                    <Button variant={"ghost"} className="underline text-sm">
                                        Lo faccio dopo
                                    </Button>
                                </DrawerClose>
                            </div>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }
    return null;
};