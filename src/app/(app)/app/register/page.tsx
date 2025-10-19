"use client";
import Gauge from "@/components/Metrics/Gauge";
import Line from "@/components/Metrics/Line";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { GradeType, PeriodType } from "@/lib/types";
import { Suspense, useEffect, useState } from "react";
import MarksPageLinkLoading, { EventsPageLinkLoading } from "./skeletons";
import { getMarksAndPeriods } from "./actions";
import NotificationSection from "@/components/NotificationSection";

export default function Page() {
  return (
    <div className="p-6 px-4 max-w-3xl mx-auto">
      <NotificationSection />
      <Suspense fallback={<MarksPageLinkLoading />}>
        <MarksPageLink />
      </Suspense>
      <Suspense fallback={<EventsPageLinkLoading />}>
        <EventsPageLink />
      </Suspense>
    </div>
  );
}

function MarksPageLink() {
  const [marks, setMarks] = useState<GradeType[]>([]);
  const [periods, setPeriods] = useState<PeriodType[]>([]);

  useEffect(() => {
    async function getMarksAndPeriodsData() {
      const marksStore = window.sessionStorage.getItem("marks");
      const periodsStore = window.sessionStorage.getItem("periods");
      if (marksStore && periodsStore) {
        setMarks(JSON.parse(marksStore));
        setPeriods(JSON.parse(periodsStore));
      } else {
        const fullData = await getMarksAndPeriods();
        if (fullData === null) {
          // Auth error - redirect to login
          window.location.href = "/";
          return;
        }
        if (fullData) {
          setMarks(fullData.marks || []);
          setPeriods(fullData.periods || []);
          window.sessionStorage.setItem("marks", JSON.stringify(fullData.marks));
          window.sessionStorage.setItem("periods", JSON.stringify(fullData.periods));
        }
      }
    }
    getMarksAndPeriodsData();
  }, []);

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
  if (!marks.length || !periods.length || !periodsAverages || !totalAverage) return <MarksPageLinkLoading />;
  return (
    <Link
      href={`/app/register/marks`}
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
