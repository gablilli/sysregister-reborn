import Gauge from "@/components/Metrics/Gauge";
import Line from "@/components/Metrics/Line";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { GradeType, PeriodType } from "@/lib/types";
import { get } from "@/lib/api";
import { cookies } from "next/headers";
import { Suspense } from "react";
import MarksPageLinkLoading, { EventsPageLinkLoading } from "./skeletons";

export default async function Page() {
  return (
    <div className="p-6 px-4">
      <Suspense fallback={<MarksPageLinkLoading />}>
        <MarksPageLink />
      </Suspense>
      <Suspense fallback={<EventsPageLinkLoading />}>
        <EventsPageLink />
      </Suspense>
    </div>
  );
}

async function MarksPageLink() {
  const studentId = cookies().get("uid")?.value;
  const marks: GradeType[] = (await get(`/v1/students/${studentId}/grades`))
    .grades;
  const periods: PeriodType[] = (await get(`/v1/students/${studentId}/periods`))
    .periods;
  const totalAverage =
    marks
      .filter((mark) => mark.color !== "blue")
      .reduce((acc, mark) => acc + mark.decimalValue, 0) /
    marks.filter((mark) => mark.color !== "blue").length;
  const periodsAverages = periods.map((period) => {
    const periodMarks = marks.filter(
      (mark) => mark.periodDesc === period.periodDesc && mark.color !== "blue"
    );
    return (
      periodMarks.reduce((acc, mark) => acc + mark.decimalValue, 0) /
        periodMarks.length || 0
    );
  });
  return (
    <Link
      href={`/register/marks`}
      className="rounded-xl flex flex-col overflow-hidden mb-4 relative p-4 py-3"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-xl">Valutazioni</p>
        </div>
        <ChevronRight className="text-secondary" />
      </div>
      <div className="flex w-full flex-col items-center mb-2 mt-3">
        <Gauge
          value={parseFloat(totalAverage.toFixed(3))}
          size={148}
          label="Media Generale"
        />
        <div className="w-full mt-5 space-y-3">
          {periods.map((period, index) => (
            <Line
              key={period.periodCode}
              label={period.periodDesc}
              value={parseFloat(periodsAverages[index].toFixed(3))}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}

function EventsPageLink() {
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
