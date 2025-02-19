"use client";
import DaySelector from "@/components/Home/DaySelector";
import { AgendaItemType, LessonType, Notification } from "@/lib/types";
import { useEffect, useState } from "react";
import { getAllNotifications, getDayAgenda, getDayLessons, setNotificationAsRead } from "./actions";
import { BellDot, ChevronRight, Loader } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useSwipeable } from 'react-swipeable'
import Checkbox from "@/components/Checkbox";
import Link from "next/link";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import InstallPWAPrompt from "@/components/InstallPWAPrompt";
import { Button } from "@/components/ui/button";

export default function Home() {
  const swipeDetector = useSwipeable({
    onSwipedRight: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSelectedDay(new Date(selectedDay.setDate(selectedDay.getDate() - 1)));
    },
    onSwipedLeft: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSelectedDay(new Date(selectedDay.setDate(selectedDay.getDate() + 1)));
    }
  });
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
      <div className={`max-w-3xl mx-auto ${agendaLoading ? 'overflow-hidden' : ''}`} {...swipeDetector}>
        <div className="p-4" ref={parent}>
          <InstallPWAPrompt />
          <NotificationSection />
          <LessonsPageLink lessons={lessons} day={selectedDay} />
          <p className="font-semibold text-2xl mb-3">Agenda</p>
          {agendaLoading && (
            <Loader className="mx-auto animate-spin mt-4" />)}
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
                      new Date(item.end).toLocaleTimeString([], {
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

function NotificationSection() {
  const [notifications, setNotifications] = useState<Notification[]>();
  useEffect(() => {
    async function fetchNotifications() {
      const readNotifications = JSON.parse(window.localStorage.getItem("read_notifications") || "[]");
      setNotifications(JSON.parse(window.sessionStorage.getItem("notifications") || "[]").filter((notification: Notification) => !readNotifications.includes(notification.id)));
      const notifications = await getAllNotifications();
      if (notifications && notifications.length > 0) {
        const unreadNotifications = notifications.filter(notification => !readNotifications.includes(notification.id));
        setNotifications(unreadNotifications);
        window.sessionStorage.setItem("notifications", JSON.stringify(unreadNotifications));
      }
    }
    fetchNotifications();
  }, []);
  async function tryReadNotification(id: string) {
    await setNotificationAsRead({ notificationId: id });
    const readNotifications = JSON.parse(window.localStorage.getItem("read_notifications") || "[]");
    readNotifications.push(id);
    setNotifications((prevNotifications) => prevNotifications?.filter(notification => notification.id !== id));
    window.localStorage.setItem("read_notifications", JSON.stringify(readNotifications));
  }
  if (notifications?.length === 0 || !notifications) {
    return null;
  }
  if (notifications.length === 1) {
    return (
      <Drawer onClose={() => tryReadNotification(notifications[0].id)}>
        <DrawerTrigger className="w-full text-left">
          <div
            className="rounded-xl overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between"
          >
            <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
            <div className="flex items-center gap-4">
              <BellDot />
              <div>
                <p className="text-text font-semibold text-md">
                  Nuova notifica da leggere
                </p>
                <p className="opacity-60 text-primary text-sm">
                  {notifications[0].title}
                </p>
              </div>
            </div>
            <ChevronRight className="text-secondary" />
          </div>
        </DrawerTrigger>
        <NotificationDrawer notification={notifications[0]} />
      </Drawer>
    )
  }



  // will be shown in the next update
  return (
    <Link
      href={`/notifications`}
      className="rounded-xl overflow-hidden mb-4 relative p-4 py-3 flex items-center justify-between"
    >
      <div className="bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0" />
      <div className="flex items-center gap-4">
        <BellDot />
        <div>
          <p className="text-text font-semibold text-md">
            Nuove notifiche da leggere
          </p>
          <p className="opacity-60 text-primary text-sm">
            {notifications?.length} notific{notifications.length === 1 ? "a" : "he"} da leggere
          </p>
        </div>
      </div>

      <ChevronRight className="text-secondary" />
    </Link>
  )
}

function NotificationDrawer({ notification }: { notification: Notification }) {
  return (
    <DrawerContent>
      <div className="mx-auto w-full max-w-sm">
        <DrawerHeader className="mb-8">
          <DrawerTitle className="text-lg font-semibold leading-6">{notification.title}
          </DrawerTitle>
          <DrawerDescription className="font-normal text-sm opacity-65 mt-2 whitespace-pre-line">{notification?.content}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="mb-4">
          {notification.link && (<Link href={notification.link}><Button className="w-full">{notification.linkTitle ? notification.linkTitle : notification.link}</Button></Link>)}
          {notification.link ? <DrawerClose className="w-full pt-1.5 text-sm">
            Chiudi
          </DrawerClose> : <DrawerClose asChild>
            <Button>Ok, chiudi</Button>
          </DrawerClose>}
        </DrawerFooter>
      </div>
    </DrawerContent>
  )
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
