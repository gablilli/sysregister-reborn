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
import { ChevronRight, Loader } from "lucide-react";
import { getMarkNotes, getMarks, getPeriods } from "../actions";

export default function Page() {
  const [periods, setPeriods] = useState<PeriodType[]>([]);
  const [marks, setMarks] = useState<GradeType[][]>([]);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [parent] = useAutoAnimate();


  useEffect(() => {
    async function fetchPeriods() {
      const periodsStore = window.sessionStorage.getItem("periods");
      if (periodsStore) {
        setPeriods(JSON.parse(periodsStore));
      } else {
        const periods = await getPeriods() as PeriodType[];
        setPeriods(periods);
        window.sessionStorage.setItem("periods", JSON.stringify(periods));
      }
    }
    fetchPeriods();
  }, []);
  useEffect(() => {
    async function fetchPeriodsMarks() {
      const marksStore = window.sessionStorage.getItem("marks");
      let marks: GradeType[];
      if (marksStore) {
        marks = JSON.parse(marksStore);
      } else {
        marks = await getMarks() as GradeType[];
        window.sessionStorage.setItem("marks", JSON.stringify(marks));
      }
      if (periods.length === 0 || !marks) return;
      const sortedMarks: GradeType[][] = [];
      for (let i = 0; i < periods.length; i++) {
        const periodMarks = marks.filter(m => m.periodDesc === periods[i].periodDesc)
        sortedMarks.push(periodMarks);
      }
      setMarks(sortedMarks);
      window.addEventListener('unload', function () {
        const readMarksIds = marks.flat().map(mark => mark.evtId);
        window.localStorage.setItem("read_marks_ids", JSON.stringify(readMarksIds));
      })
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
        <Tabs defaultValue={"all"} >
          <div className="sticky top-0 z-10 shadow-xl pt-4 pb-4 bg-background">
            <p className="text-3xl mb-2 font-semibold">Valutazioni</p>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${periods.length + 1}, 1fr)` }}>
              <TabsTrigger value={"all"}>Valutazioni</TabsTrigger>
              {periods.map((period, index) => (
                <TabsTrigger key={index} value={period.periodDesc}>{period.periodDesc}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent ref={parent} value="all">
            <div className="flex flex-col gap-8">
              {marks.flat().filter(mark => !(JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId)).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">
                    Nuovi voti ({marks.flat().filter(mark => !(JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId)).length})
                  </p>
                  <div className="flex flex-col gap-3">
                    {marks.map((periodMarks) => (
                      periodMarks
                        .sort((a, b) => {
                          const [dayA, monthA] = a.evtDate.split('/').map(Number);
                          const [dayB, monthB] = b.evtDate.split('/').map(Number);
                          return monthA === monthB ? dayA - dayB : monthA - monthB;
                        })
                        .reverse()
                        .filter(mark => !(JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId))
                        .map(mark => (
                          <>
                            <MarkEntry key={mark.evtId} mark={mark} />
                            {(JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId)}
                          </>
                        ))
                    ))}
                  </div>
                </div>
              )}
              {marks.flat().filter(mark => (JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId)).length > 0 && (
                <div>
                  {marks.flat().filter(mark => !(JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId)).length !== 0 && (<p className="font-semibold text-2xl mb-1.5">Giá visti</p>)}
                  <div className="flex flex-col gap-3">
                    {marks.reverse().map((periodMarks) => (
                      periodMarks
                        .sort((a, b) => {
                          const [dayA, monthA] = a.evtDate.split('/').map(Number);
                          const [dayB, monthB] = b.evtDate.split('/').map(Number);
                          return monthA === monthB ? dayA - dayB : monthA - monthB;
                        })
                        .reverse()
                        .filter(mark => (JSON.parse(window.localStorage.getItem("read_marks_ids") || "[]")).includes(mark.evtId))
                        .map(mark => (
                          <MarkEntry key={mark.evtId} mark={mark} />
                        ))
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          {subjects.length !== 0 && periods.map((period, index) => (
            <TabsContent ref={parent} key={index} value={period.periodDesc} className="flex flex-col gap-2 mt-0">
                <div className="relative flex flex-col gap-2 items-center justify-center overflow-hidden p-4 pb-6 rounded-xl mb-4">
                <div className="top-0 bottom-0 left-0 right-0 absolute -z-10 opacity-20 bg-secondary" />
                <p className="text-lg font-semibold">Media del {periods[index].periodDesc}</p>
                <Gauge value={parseFloat(getGradesAverage(marks.slice().reverse()[index]).toFixed(3))} size={120} />
                </div>
              {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) < 6).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">Da recuperare ({subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) < 6).length})</p>
                  {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) < 6).map(subject => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              )}
              {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) >= 6).length !== 0 && (
                <div>
                  <p className="font-semibold text-2xl mb-1.5">Sufficienti ({subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) >= 6).length})</p>
                  {subjects[index].filter(subject => subject.marks && getGradesAverage(subject.marks) >= 6).map(subject => (
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
    return ((6 * (count + 1)) - (average * count)).toFixed(2);
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
          {subject.marks && getGradesAverage(subject.marks) < 6 ? (
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

function MarkEntry({ mark }: { mark: GradeType }) {
  const [parent] = useAutoAnimate();
  const [notes, setNotes] = useState<string | boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div ref={parent} key={mark.evtId} className="relative p-3 px-3 rounded-xl overflow-hidden" onClick={async () => {
      if (notes == null) {
        setLoading(true);
        const storedNotes = window.sessionStorage.getItem(`mark_note_${mark.evtId}`);
        if (storedNotes) {
          setNotes(storedNotes);
        } else {
          const notes = await getMarkNotes(mark.evtId);
          if (!notes) {
            setNotes(false);
          } else {
            setNotes(notes || "");
            window.sessionStorage.setItem(`mark_note_${mark.evtId}`, notes);
          }
        }
        setLoading(false);
      } else {
        setNotes(null);
      }
    }}>
      <div className="top-0 bottom-0 left-0 right-0 absolute -z-10 opacity-20 bg-secondary" />
      <div className="flex items-center gap-4">
        <div>
          <span
            className={` ${mark.color === "blue"
              ? "bg-blue-900"
              : mark.decimalValue <= 5.5
                ? "bg-red-600"
                : mark.decimalValue < 6.0
                  ? "bg-yellow-600"
                  : "bg-green-600"
              } w-14 h-14 text-xl flex rounded-full font-semibold justify-center items-center text-white`}
          >
            {loading ? <Loader className="animate-spin" /> : mark.displayValue}
          </span>
        </div>
        <div className="">
          <p className="text-sm">{mark.periodDesc}</p>
          <p className="font-semibold">{mark.subjectDesc}</p>
          <p className="opacity-60 text-sm">{mark.componentDesc ? mark.componentDesc : "Voto di prova"} • {mark.evtDate}</p>
        </div>
      </div>
      {notes != null && (
        <div className="flex items-center mt-3 relative p-4 rounded-lg overflow-hidden">
          <div className="bg-secondary -z-10 opacity-30 absolute top-0 bottom-0 left-0 right-0" />
          <span className="whitespace-pre-wrap">{notes}</span>
          {!notes && <span className="italic font-semibold">Il docente non ha inserito note per la famiglia.</span>}
        </div>
      )}
    </div>
  )
}