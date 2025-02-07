"use client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GradeType, PeriodType, Subject, Subjects } from "@/lib/types";
import { useEffect, useState } from "react";
import { getGradesAverage } from "@/lib/utils";
import Gauge from "@/components/Metrics/Gauge";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getMarks, getPeriods } from "../actions";

export default function Page() {
  const [periods, setPeriods] = useState<PeriodType[]>([]);
  const [marks, setMarks] = useState<GradeType[][]>([]);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [parent] = useAutoAnimate();


  useEffect(() => {
    async function fetchPeriods() {
      const periods = await getPeriods() as PeriodType[];
      setPeriods(periods);
    }
    fetchPeriods();
  }, []);
  useEffect(() => {
    async function fetchPeriodsMarks() {
      if (periods.length === 0) return;
      const marks: GradeType[] = await getMarks() as GradeType[];
      const sortedMarks: GradeType[][] = [];
      for (let i = 0; i < periods.length; i++) {
        const periodMarks = marks.filter(m => m.periodDesc === periods[i].periodDesc)
        sortedMarks.push(periodMarks);
      }
      setMarks(sortedMarks);
    }
    fetchPeriodsMarks();
  }, [periods]);
  useEffect(() => {
    async function getSubjects() {
      const sortedSubjects: Subject[][] = [];
      for (let n = 0; n < periods.length; n++) {
        const periodSubjects: Subjects = [];
        for (let j = 0; j < marks.length; j++) {
          for (let i = 0; i < marks[j].length; i++) {
            if (marks[j][i].periodDesc === periods[n].periodDesc) {
              const existingSubject = periodSubjects.find(s => s.id === marks[j][i].subjectId);
              if (existingSubject) {
                existingSubject.marks?.push(marks[j][i]);
              } else {
                periodSubjects.push({
                  id: marks[j][i].subjectId,
                  name: marks[j][i].subjectDesc,
                  teachers: [],
                  marks: marks[j][i].decimalValue ? [marks[j][i]] : []
                });
              }
            }
          }
        }
        sortedSubjects.push(periodSubjects);
      }
      setSubjects(sortedSubjects);
    }
    if (marks.length !== 0) {
      getSubjects();
    }
  }, [marks, periods]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {periods.length !== 0 ? (
        <Tabs defaultValue={periods[1].periodDesc} >
          <div className="sticky top-0 z-10 shadow-xl pt-4 pb-4 bg-background">
            <p className="text-3xl mb-2 font-semibold">Valutazioni</p>
            <TabsList className="grid  w-full grid-cols-2">
              {periods.map((period, index) => (
                <TabsTrigger key={index} value={period.periodDesc}>{period.periodDesc}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          {subjects.length !== 0 && periods.map((period, index) => (
            <TabsContent ref={parent} key={index} value={period.periodDesc} className="flex flex-col gap-2 mt-0">
              <div className="relative flex flex-col gap-2 items-center justify-center overflow-hidden p-4 pb-6 rounded-xl mb-4">
                <div className="top-0 bottom-0 left-0 right-0 absolute -z-10 opacity-20 bg-secondary" />
                <p className="text-lg font-semibold">Media del {periods[index].periodDesc}</p>
                <Gauge value={parseFloat(getGradesAverage(marks[index]).toFixed(3))} size={120} />
              </div>
              {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) < 5.5).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">Da recuperare ({subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) < 5.5).length})</p>
                  {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) < 5.5).map(subject => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              )}
              {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) >= 5.5).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">Sufficienti ({subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) >= 5.5).length})</p>
                  {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) >= 5.5).map(subject => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : PeriodsTabsSkeleton()}
    </div>
  )
}

function SubjectCard({ subject }: { subject: Subject }) {
  const calculateNeededValue = (average: number, count: number) => {
    return ((5.5 * (count + 1)) - (average * count)).toFixed(2);
  }
  return (
    <Link href={`/register/marks/${subject.name}`} className="relative flex gap-4 items-start justify-start overflow-hidden p-4 rounded-xl mb-4">
      <div className="top-0 bottom-0 left-0 right-0 absolute -z-10 opacity-20 bg-secondary" />
      <div className="flex-shrink-0">
      {subject.marks && <Gauge value={parseFloat(getGradesAverage(subject.marks).toFixed(3))} size={80} />}
      </div>
      <div className="flex-1">
      <p className="text-MD font-semibold">{subject.name.split('-')[0]}</p>
      <p className="opacity-55 text-text text-sm">
        {subject.marks && getGradesAverage(subject.marks) < 5.5 ? (
        <>
          {parseFloat(calculateNeededValue(getGradesAverage(subject.marks), subject.marks.length)) > 10 ? (
          <>Devi prendere almeno <b>10 e un altro voto</b> per arrivare alla sufficienza.</>
          ) : parseFloat(calculateNeededValue(getGradesAverage(subject.marks), subject.marks.length)) < 1 ? (
          <>Puoi stare tranquillo.</>
          ) : (
          <>Devi prendere almeno <b>{calculateNeededValue(getGradesAverage(subject.marks), subject.marks.length)}</b> per raggiungere la sufficienza.</>
          )}
        </>
        ) : (
        <>
          {subject.marks && parseFloat(calculateNeededValue(getGradesAverage(subject.marks), subject.marks.length)) > 10 ? (
          <>Non prendere meno di <b>10 e un altro voto</b> per mantenere la sufficienza.</>
          ) : subject.marks && parseFloat(calculateNeededValue(getGradesAverage(subject.marks), subject.marks.length)) < 1 ? (
          <>Puoi stare tranquillo.</>
          ) : (
          <>Non prendere meno di <b>{calculateNeededValue(getGradesAverage(subject.marks || []), subject.marks?.length || 0)}</b> per mantenere la sufficienza.</>
          )}
        </>
        )}
      </p>
      </div>
      <ChevronRight className="text-secondary" />
    </Link>
  )
}

function PeriodsTabsSkeleton() {
  return (
    <div className="inline-flex h-9 items-center relative !bg-red-950 overflow-hidden justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full animate-pulse" />
  )
}