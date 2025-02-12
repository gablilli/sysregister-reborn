"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";


export default function Page() {
    return (
        <div className="p-4 max-w-3xl mx-auto">
            <div className="sticky top-0 z-10 shadow-xl pt-4 bg-background">
                <p className="text-3xl mb-4 font-semibold">Social</p>
            </div>
            <div className="flex flex-col gap-4">
                <Link
                    href="/social/spotted"
                    className="rounded-xl overflow-hidden relative p-4 flex flex-col items-center justify-between"
                >
                    <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                    {/* <div className="bg-red-900 h-[150px] w-full rounded-lg mb-3">

                </div> */}
                    <div className="w-full flex items-center justify-between">
                        <div className="flex flex-col justify-start">
                            <div className="flex flex-col justify-between">
                                <p className="text-lg font-semibold">Spotted</p>
                                <p className="opacity-60 text-sm">Spotta qualcosa o qualcuno.</p>
                            </div>
                        </div>
                        <ChevronRight className="text-secondary" />
                    </div>
                </Link>
                <Link
                    href="/social/lb"
                    className="rounded-xl overflow-hidden relative p-4 flex flex-col items-center justify-between"
                >
                    <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                    {/* <div className="bg-red-900 h-[150px] w-full rounded-lg mb-3">

                </div> */}
                    <div className="w-full flex items-center justify-between">
                        <div className="flex flex-col justify-start">
                            <div className="flex flex-col justify-between">
                                <p className="text-lg font-semibold">Classifiche</p>
                                <p className="opacity-60 text-sm">Consulta le classifiche generali.</p>
                            </div>
                        </div>
                        <ChevronRight className="text-secondary" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
