"use client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GradeType, PeriodType, Subject, Subjects } from "@/lib/types";
import { useEffect, useState } from "react";
import { fetchMarks, fetchPeriods } from "./actions";
import { getGradesAverage } from "@/lib/utils";
import Gauge from "@/components/Metrics/Gauge";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function Page() {
  const [periods, setPeriods] = useState<PeriodType[]>([]);
  const [marks, setMarks] = useState<GradeType[][]>([]);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [parent] = useAutoAnimate();


  useEffect(() => {
    async function getPeriods() {
      const periods = await fetchPeriods();
      setPeriods(periods);
    }
    getPeriods();
  }, []);
  useEffect(() => {
    async function getPeriodsMarks() {
      if (periods.length === 0) return;
      const marks: GradeType[] = await fetchMarks();
      const sortedMarks: GradeType[][] = [];
      for (let i = 0; i < periods.length; i++) {
        const periodMarks = marks.filter(m => m.periodDesc === periods[i].periodDesc)
        sortedMarks.push(periodMarks);
      }
      setMarks(sortedMarks);
    }
    getPeriodsMarks();
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
                existingSubject.marks.push(marks[j][i]);
              } else {
                periodSubjects.push({
                  id: marks[j][i].subjectId,
                  description: marks[j][i].subjectDesc,
                  order: marks[j][i].displaPos,
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
    <div className="p-4">
      <p className="text-3xl mb-2 mt-2 font-semibold">Valutazioni</p>
      {periods.length !== 0 ? (
        <Tabs defaultValue={periods[1].periodDesc} >
          <TabsList className="grid mb-6 w-full grid-cols-2">
            {periods.map((period, index) => (
              <TabsTrigger key={index} value={period.periodDesc}>{period.periodDesc}</TabsTrigger>
            ))}
          </TabsList>
          {subjects.length !== 0 && periods.map((period, index) => (
            <TabsContent ref={parent} key={index} value={period.periodDesc} className="flex flex-col gap-2">
              {subjects[index].filter(subject => getGradesAverage(subject.marks) < 5.5).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">Da recuperare ({subjects[index].filter(subject => getGradesAverage(subject.marks) < 5.5).length})</p>
                  {subjects[index].filter(subject => getGradesAverage(subject.marks) < 5.5).map(subject => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              )}
              {subjects[index].filter(subject => getGradesAverage(subject.marks) >= 5.5).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">Sufficienti ({subjects[index].filter(subject => getGradesAverage(subject.marks) >= 5.5).length})</p>
                  {subjects[index].filter(subject => getGradesAverage(subject.marks) >= 5.5).map(subject => (
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
  return (
    <div className="relative flex gap-4 items-start justify-start overflow-hidden p-4 rounded-xl mb-4">
      <div className="top-0 bottom-0 left-0 right-0 absolute -z-10 opacity-20 bg-secondary" />    <div className="flex-shrink-0">
        <Gauge value={parseFloat(getGradesAverage(subject.marks).toFixed(3))} size={80} /></div>
      <div>
        <p className="text-MD font-semibold">{subject.description.split('-')[0]}</p>
        <p className="opacity-55 text-text text-sm">
          {getGradesAverage(subject.marks) < 5.5 ? (
            <>Devi prendere almeno <b>{(5.5 - getGradesAverage(subject.marks)).toFixed(2)}</b> per raggiungere la sufficienza.</>
          ) : (
            <>Non prendere meno di <b>{(getGradesAverage(subject.marks) - 5.5).toFixed(2)}</b> per mantenere la sufficienza.</>
          )}
        </p>
      </div>
    </div>
  )
}

function PeriodsTabsSkeleton() {
  return (
    <div className="inline-flex h-9 items-center relative !bg-red-950 overflow-hidden justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full animate-pulse" />
  )
}