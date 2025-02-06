import Gauge from "@/components/Metrics/Gauge";
import Line from "@/components/Metrics/Line";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MarksPageLinkLoading() {
  return (
    <Link
      href={`/register/marks`}
      className="rounded-xl flex flex-col opacity-40 overflow-hidden mb-4 relative p-4 py-3"
    >
      <div className="absolute top-0 left-0 right-0 ease-in-out bottom-0 animate-pulse bg-secondary z-10" />
      <div className="flex invisible items-center justify-between">
        <div>
          <p className="font-semibold text-xl">Valutazioni</p>
        </div>
        <ChevronRight className="text-secondary" />
      </div>
      <div className="flex w-full flex-col items-center mb-2 mt-3">
        <div className="invisible">
          <Gauge value={0} size={148} label="Media Generale" />
        </div>
        <div className="w-full invisible mt-5 space-y-3">
          <Line label={"Trimestre"} value={0} />
          <Line label={"Pentamestre"} value={0} />
        </div>
      </div>
    </Link>
  );
}

export function EventsPageLinkLoading() {
  return null;
  return (
    <Link
      href={`#`}
      className="rounded-xl overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div>
        <p className="font-semibold">Eventi</p>
        <p className="opacity-60 text-primary text-sm">
          Tutto ok, niente da giustificare.
        </p>
      </div>
      <ChevronRight className="text-secondary" />
    </Link>
  );
}
