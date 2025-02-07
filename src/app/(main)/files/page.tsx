"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getBacheca } from "./actions";
import { useEffect, useState } from "react";
import { BachecaType } from "@/lib/types";
import Wip from "@/components/Wip";

export default function Page() {
  const [bachecaLoading, setBachecaLoading] = useState(true);
  const [bacheca, setBacheca] = useState<BachecaType[]>([]);

  useEffect(() => {
    async function getBachecaItems() {
      const res: BachecaType[] = await getBacheca();
      setBacheca(res.filter((item) => item.readStatus === false));
      setBachecaLoading(false);
    }
    getBachecaItems();
  }, []);

  return <Wip />;
  return (
    <div className="p-4 py-6 max-w-3xl mx-auto flex flex-col gap-5">
      {bachecaLoading ? (
        <BigPageLinkSkeleton href="#" />) : (
        <BigPageLink label="Bacheca" description={bacheca.length === 0 ? `Tutto ok, niente da leggere.` : `Hai ${bacheca.length} messaggi da leggere`} href="#" />)
      }
      <SmallPageLink label="Didattica" description="Contenuti caricati dai professori" href="#" />
    </div>
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
          <p className="text-xl font-semibold">{label}</p>
          <p className="text-lg font-semibold mt-4">{description}</p>
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
          <p className="text-lg font-semibold">{label}</p>
          <p className="opacity-60 text-">{description}</p>
        </div>
      </div>
      <ChevronRight className="text-secondary" />
    </Link>
  )
}