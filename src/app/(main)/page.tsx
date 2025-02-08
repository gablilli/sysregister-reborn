"use client";
import DaySelector from "@/components/Home/DaySelector";
import { AgendaItemType, LessonType } from "@/lib/types";
import { useEffect, useState } from "react";
import { getDayAgenda, getDayLessons } from "./actions";
import { ChevronRight } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Checkbox from "@/components/Checkbox";
import Link from "next/link";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";

export default function Home() {
  const [parent] = useAutoAnimate();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [agenda, setAgenda] = useState<AgendaItemType[]>([]);
  const [agendaLoading, setAgendaLoading] = useState<boolean>(true);

  async function toggleCompletedAgenda(evtId: number) {
    const completedAgenda = JSON.parse(
      localStorage.getItem("completedAgenda") || "[]"
    );
    let updatedCompletedAgenda;
    if (completedAgenda.includes(evtId)) {
      updatedCompletedAgenda = completedAgenda.filter(
        (id: number) => id !== evtId
      );
    } else {
      updatedCompletedAgenda = [...completedAgenda, evtId];
    }
    localStorage.setItem(
      "completedAgenda",
      JSON.stringify(updatedCompletedAgenda)
    );
    setAgenda((prevAgenda) =>
      prevAgenda.map((item) => {
        if (Number(item.id) === evtId) {
          return {
            ...item,
            completed: updatedCompletedAgenda.includes(Number(item.id)),
          };
        }
        return item;
      })
    );
  }

  useEffect(() => {
    // clear agenda and lessons when day changes
    setLessons([]);
    setAgenda([]);

    async function fetchDayAgenda() {
      const agendaStore = window.sessionStorage.getItem("agenda");
      if (agendaStore && JSON.parse(agendaStore).day === selectedDay.toDateString()) {
        setAgenda(JSON.parse(agendaStore).agenda);
        setAgendaLoading(false);
      } else {
        setAgendaLoading(true);
        const agenda = await getDayAgenda(selectedDay);
        const completedAgenda = JSON.parse(
          localStorage.getItem("completedAgenda") || "[]"
        );
        const updatedAgenda: AgendaItemType[] = agenda.map(
          (item: AgendaItemType) => ({
            ...item,
            completed: completedAgenda.includes(Number(item.id)),
          })
        );
        setAgenda(updatedAgenda);
        window.sessionStorage.setItem("agenda", JSON.stringify({ agenda: updatedAgenda, day: selectedDay }));
        setAgendaLoading(false);
      }
    }

    async function fetchLessons() {
      const lessons = await getDayLessons(selectedDay);
      setLessons(lessons);
    }

    fetchDayAgenda();
    fetchLessons();
  }, [selectedDay]);

  return (
    <div className="-translate-y-4">
      <div className="sticky z-50 top-4 shadow-xl">
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-secondary opacity-20 -z-10" />
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-background -z-20" />
        <DaySelector setCurrentDay={setSelectedDay} currentDay={selectedDay} />
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="p-4" ref={parent}>
          <InstallPWAPrompt />
          <LessonsPageLink lessons={lessons} day={selectedDay} />
          <p className="font-semibold text-2xl mb-3">Agenda</p>
          <div className="flex gap-4 flex-col" ref={parent}>
            {!agendaLoading && agenda && agenda.length === 0 && (
              <div className="rounded-xl overflow-hidden relative opacity-50 p-4">
                <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
                <p className="text-primary font-semibold text-center">
                  Nessun evento su agenda
                </p>
              </div>
            )}
            {!agendaLoading &&
              agenda &&
              agenda
                .filter((item) => !item.completed)
                .map((item, index) => (
                  <AgendaItem
                    key={index}
                    completed={item.completed as boolean}
                    author={item.autore_desc}
                    toggleCompletedAgenda={() =>
                      toggleCompletedAgenda(Number(item.id))
                    }
                    time={
                      new Date(item.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) +
                      " - " +
                      new Date(item.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                    content={item.title}
                  />
                ))}
            {!agendaLoading &&
              agenda &&
              agenda
                .filter((item) => item.completed)
                .map((item, index) => (
                  <AgendaItem
                    key={index}
                    completed={item.completed as boolean}
                    author={item.autore_desc}
                    toggleCompletedAgenda={() =>
                      toggleCompletedAgenda(Number(item.id))
                    }
                    time={
                      new Date(item.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) +
                      " - " +
                      new Date(item.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                    content={item.title}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaItem({
  author,
  time,
  content,
  toggleCompletedAgenda,
  completed,
}: {
  author: string;
  time: string;
  content: string;
  toggleCompletedAgenda: () => void;
  completed: boolean;
}) {
  return (
    <div
      className={`rounded-xl transition-all ${completed ? "opacity-45" : "opacity-100"
        } overflow-hidden relative p-4`}
    >
      <div
        className={
          "bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0"
        }
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text font-semibold">{author}</p>
          <div className="text-accent flex flex-col">
            <span className="opacity-50 text-sm">{time}</span>
          </div>
        </div>
        <div onClick={() => toggleCompletedAgenda()}>
          <Checkbox checked={completed} onChange={() => null} />
        </div>
      </div>
      <div className="relative overflow-hidden p-2 rounded-md mt-3">
        <div className="absolute bg-accent -z-10 opacity-35 top-0 left-0 right-0 bottom-0" />
        <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
      </div>
    </div>
  );
}

function LessonsPageLink({
  lessons,
  day,
}: {
  lessons: LessonType[];
  day: Date;
}) {
  const monthNames = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];

  if (lessons && lessons.length === 0 || !lessons) {
    return null;
  }

  return (
    <Link
      href={`/lessons/${day.getFullYear()}${(day.getMonth() + 1 < 10 ? "0" : "") + (day.getMonth() + 1)
        }${day.getDate() < 10 ? "0" : ""}${day.getDate()}`}
      className="rounded-xl overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div>
        <p className="text-text font-semibold text-md">
          Lezioni{" "}
          {day.toDateString() === new Date().toDateString()
            ? "di oggi"
            : `del giorno ${day.getDate()} ${monthNames[day.getMonth()]}`}
        </p>
        <p className="opacity-60 text-primary text-sm">
          {lessons && lessons.length} firme da professori
        </p>
      </div>
      <ChevronRight className="text-secondary" />
    </Link>
  );
}
