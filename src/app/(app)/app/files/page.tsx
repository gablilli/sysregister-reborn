"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getBacheca } from "./actions";
import { useEffect, useState } from "react";
import { BachecaType } from "@/lib/types";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";
import NotificationSection from "@/components/NotificationSection";

type BachecaResponse = {
  read: BachecaType[];
  msg_new: BachecaType[];
}

export default function Page() {
  const [bachecaLoading, setBachecaLoading] = useState(true);
  const [bacheca, setBacheca] = useState<BachecaResponse>();

  useEffect(() => {
    async function getBachecaItems() {
      const storedBacheca = sessionStorage.getItem('bacheca');
      if (storedBacheca) {
        setBacheca(JSON.parse(storedBacheca));
        setBachecaLoading(false);
      } else {
        const res = await getBacheca();
        if (res === null) {
          // Auth error - redirect to login
          window.location.href = "/";
          return;
        }
        sessionStorage.setItem('bacheca', JSON.stringify(res));
        setBacheca(res as BachecaResponse);
        setBachecaLoading(false);
      }
    }
    getBachecaItems();
  }, []);

  return (
    <>

      <div className="p-4 py-6 max-w-3xl mx-auto flex flex-col">
        <div>
          <InstallPWAPrompt />
          <NotificationSection />
        </div>
        <div className="flex flex-col gap-5">
          {bachecaLoading ? (
            <BigPageLinkSkeleton href="/files/bacheca" />) : (
            <BigPageLink label="Bacheca" description={bacheca?.msg_new ? `Hai ${bacheca?.msg_new.length} messaggi da leggere` : `Tutto ok, niente da leggere.`} href="/files/bacheca" />)
          }
          <div className="opacity-30 flex flex-col gap-5">
            <BigPageLink label="Compiti" description={`Funzionalitá presto disponibile...`} href="#" />
            <SmallPageLink label="Didattica" description="Funzionalitá Presto disponibile..." href="#" /></div>
        </div>
      </div>
    </>
  )
}

function BigPageLink({ label, description, href }: { label: string, description: string, href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl overflow-hidden relative p-4 flex items-start justify-between"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div className="flex flex-col justify-start">
        <div className="flex  min-h-[130px] flex-col justify-between">
          <p className="text-xl font-semibold ph-censor-text">{label}</p>
          <p className="text-lg font-semibold mt-4 ph-censor-text">{description}</p>
        </div>
      </div>
      <ChevronRight className="text-secondary" />
    </Link>
  )
}

function BigPageLinkSkeleton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl animate-pulse overflow-hidden relative p-4 flex items-start justify-between"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div className="flex flex-col justify-start">
        <div className="flex min-h-[130px] flex-col justify-between">
          <p className="text-xl hidden font-semibold">-</p>
          <p className="text-lg hidden font-semibold mt-4">-</p>
        </div>
      </div>
      <ChevronRight className="text-secondary hidden" />
    </Link>
  )
}

function SmallPageLink({ label, description, href }: { label: string, description: string, href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl overflow-hidden relative p-4 flex items-center justify-between"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div className="flex flex-col justify-start">
        <div className="flex flex-col justify-between">
          <p className="text-lg font-semibold ph-censor-text">{label}</p>
          <p className="opacity-60 text-sm ph-censor-text">{description}</p>
        </div>
      </div>
      <ChevronRight className="text-secondary" />
    </Link>
  )
}