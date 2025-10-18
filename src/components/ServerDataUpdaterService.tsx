"use client";
import { setUserName, updateServerData } from "@/app/(app)/app/actions";
import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { Input, InputLabel } from "./Input";
import { Loader } from "lucide-react";

export function ServerDataUpdaterService() {
    const [resultCode, setResultCode] = useState<string | null>(null);
    useEffect(() => {
        async function callServerUpdater() {
            const result = await updateServerData();
            setResultCode(result as string);
        }
        callServerUpdater();
    }, []);

    if (resultCode == "username_not_set") {
        return <UsernameDrawer />;
    }
    return null;
}


function UsernameDrawer() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    async function trySetUsername() {
        setLoading(true);
        if (!username) {
            setError("L'username non può essere vuoto.");
            return;
        }
        const error = await setUserName(username);
        if (error) {
            setError(error);
            setLoading(false);
            return;
        } else {
            setLoading(false);
            window.location.reload();
        }
    }
    return (
        <Drawer repositionInputs={false} disablePreventScroll={false} open={true}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl">Imposta il tuo username</DrawerTitle>
                        <DrawerDescription className="opacity-50">Il tuo username sará visibile agli altri e non potrai cambiarlo in futuro.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0">
                        <div className="w-full mt-4">
                            <InputLabel text={"Username"} />
                            <Input
                                onChange={(e) => setUsername(e.target.value)}
                                value={username || ""}
                                name="sysregister-username-set"
                                placeholder="@SysWhite"
                                autoCorrect="off"
                            />
                            {error && <span className="text-sm text-accent mt-2">{error}</span>}
                        </div>
                    </div>
                    <DrawerFooter className="mt-8 mb-4">
                        <Button onClick={async () => {
                            await trySetUsername();
                        }}>
                            {loading ? <Loader className="animate-spin" /> : "Conferma"}
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}