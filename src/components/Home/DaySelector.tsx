"use client";
import { useEffect, useRef } from "react";

export default function DaySelector({
  currentDay,
  setCurrentDay,
}: {
  currentDay: Date;
  setCurrentDay: (day: Date) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const currentDayButtonRef = useRef<HTMLButtonElement | null>(null);

  function getDayInterval(): Date[] {
    const dayInterval: Date[] = [];
    const currentDate = new Date();
    for (let i = -50; i <= 50; i++) {
      const day = new Date(currentDate);
      day.setDate(currentDate.getDate() + i);
      dayInterval.push(day);
    }
    return dayInterval;
  }

  useEffect(() => {
    if (scrollContainerRef.current && currentDayButtonRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const buttonOffsetLeft = currentDayButtonRef.current.offsetLeft;
      const buttonWidth = currentDayButtonRef.current.offsetWidth;
      const scrollPosition =
        buttonOffsetLeft - containerWidth / 2 + buttonWidth / 2;

      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentDay]);

  return (
    <div>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hidden px-2 items-center py-4 justify-between"
      >
        {getDayInterval().map((day) => (
          <button
            key={day.toISOString()}
            className="flex flex-col px-2 items-center justify-center"
            onClick={() => setCurrentDay(day)}
            ref={
              day.toDateString() === currentDay.toDateString()
                ? currentDayButtonRef
                : null
            }
          >
            <p className="text-secondary w-full pb-2 text-center px-2 justify-between text-sm">
                {day.toLocaleString("it-IT", { weekday: "short" }).slice(0, 1).toUpperCase() + day.toLocaleString("it-IT", { weekday: "short" }).slice(1, 3)}
            </p>
            <div
              className={`text-accent text-center text-lg font-semibold flex items-center justify-center w-10 h-10 p-2.5 rounded-full transition-all ${
                day.toDateString() === currentDay.toDateString()

                  ? "bg-primary text-white"
                  : "bg-primary-light"
              }`}
            >
              {day.getDate()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
