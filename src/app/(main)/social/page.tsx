"use client";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptSocialTerms, hasUserAcceptedSocialTerms } from "./actions";
import { useEffect, useState } from "react";

export default function Page() {
    return (
        <div className="p-4 max-w-3xl mx-auto">
            <SocialTermsDrawer />
            <div className="sticky top-0 z-10 shadow-xl pt-4 bg-background">
                <p className="text-3xl mb-2 font-semibold">Social</p>
            </div>
            <Link
                href="#"
                className="rounded-xl overflow-hidden relative p-4 flex flex-col items-center justify-between"
            >
                <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                {/* <div className="bg-red-900 h-[150px] w-full rounded-lg mb-3">

                </div> */}
                <div className="w-full flex items-center justify-between">
                    <div className="flex flex-col justify-start">
                        <div className="flex flex-col justify-between">
                            <p className="text-lg font-semibold">Classifiche</p>
                            <p className="opacity-60 text-sm">Presto disponibili...</p>
                        </div>
                    </div>
                    <ChevronRight className="text-secondary" />
                </div>
            </Link>
        </div>
    )
}

function SocialTermsDrawer() {
    const router = useRouter();
    const [hasUserAcceptedTerms, setHasUserAcceptedTerms] = useState<boolean>(true);
    useEffect(() => {
        async function getUserDecision() {
            setHasUserAcceptedTerms(await hasUserAcceptedSocialTerms() as boolean);
        }
        getUserDecision();
    }, []);
    return (
        <Drawer open={!hasUserAcceptedTerms}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl">Accordo sui Dati</DrawerTitle>
                        <DrawerDescription className="opacity-50">Si prega di leggere e accettare i termini per continuare.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0">
                        <div className="flex flex-col space-y-2">
                            <p>Procedendo, accetti la raccolta e l&apos;archiviazione anonima dei tuoi dati sui nostri server in conformità con le normative GDPR. I tuoi dati saranno utilizzati esclusivamente per le classifiche generali, e non saranno condivisi con terze parti.</p>
                            <p className="text-sm opacity-70">Puoi revocare il tuo consenso e rimuovere tutti i tuoi dati dai server in qualsiasi momento contattando <u>@sys.white</u> su instagram o scrivendo una mail a riguardo a <u>commercial@syswhite.dev</u>.</p>
                        </div>
                    </div>
                    <DrawerFooter className="mt-8 mb-4">
                        <Button onClick={async () => {
                            await acceptSocialTerms();
                            window.location.reload();
                        }}>Accetta e continua</Button>
                        <Button onClick={() => {
                            router.push("/");
                        }} variant="ghost" className="text-sm">Non acconsento al salvataggio dei miei dati</Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}