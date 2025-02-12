"use client";
import { useRouter } from "next/navigation";
import { acceptSocialTerms, hasUserAcceptedSocialTerms } from "./actions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <SocialTermsDrawer />
            {children}
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