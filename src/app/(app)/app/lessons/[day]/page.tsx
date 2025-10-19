"use client";
import { LessonType } from "@/lib/types";
import { getDayLessons } from "../../actions";
import { Suspense, useEffect, useState } from "react";

const formatDate = (dateString: string) => {
  const months = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
  ];
  const date = new Date(
    parseInt(dateString.substring(0, 4)),
    parseInt(dateString.substring(4, 6)) - 1,
    parseInt(dateString.substring(6, 8))
  );
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

const Page = ({ params }: { params: { day: string }; }) => {
  const day = params.day;
  const formattedDate = day ? formatDate(day) : '';
  const [lessonsData, setLessonsData] = useState<LessonType[]>([]);

  useEffect(() => {
    async function getLessonData() {
      const date = new Date(
        parseInt(day.substring(0, 4)),
        parseInt(day.substring(4, 6)) - 1,
        parseInt(day.substring(6, 8)),
        new Date().getHours(),
        new Date().getMinutes(),
        new Date().getSeconds()
      );
      const data = await getDayLessons(date);
      if (data && Array.isArray(data)) {
        setLessonsData(data as LessonType[]);
      }
    }
    getLessonData();
  }, [day]);

  const lessons: LessonType[] = lessonsData.reduce((acc: LessonType[], lesson: LessonType) => {
    const existingLesson = acc.find(l => l.ora === lesson.ora && l.argomento === lesson.argomento);
    if (existingLesson) {
      existingLesson.docente = `${existingLesson.docente}, ${lesson.docente}`;
    } else {
      acc.push({ ...lesson });
    }
    return acc;
  }, []).sort((a, b) => Number(a.ora) - Number(b.ora));

  return (
    <div className="p-4">
      <Suspense fallback={<div>Caricamento...</div>} >
        <div className="max-w-3xl mx-auto">
          <p className="text-2xl font-semibold mb-3 mt-3 ph-censor-text">Lezioni del {formattedDate}</p>
          <div>
            {lessons && lessons.map((lesson, index) => (
              <div key={index}>
                <LessonItem
                  attivita={lesson.attivita}
                  subject={lesson.materia_desc.split("-")[0]}
                  teachers={lesson.docente}
                  time={lesson.ora.toString()}
                  content={lesson.argomento}
                  type={
                    (!lessons[index + 1] || lessons[index + 1].ora !== lesson.ora) && (!lessons[index - 1] || lessons[index - 1].ora !== lesson.ora)
                      ? "single"
                      : (!lessons[index + 1] || lessons[index + 1].ora !== lesson.ora)
                        ? "last"
                        : (!lessons[index - 1] || lessons[index - 1].ora !== lesson.ora)
                          ? "first"
                          : ""
                  }
                />
                {(lessons[index + 1] && lessons[index + 1].ora !== lesson.ora) && <div className="h-8 border border-dashed w-[1px] opacity-50 mx-auto" />}
              </div>
            ))}
          </div></div>
      </Suspense>
    </div>
  );
};
function LessonItem({
  subject,
  teachers,
  time,
  content,
  type,
  attivita
}: {
  subject: string;
  teachers: string;
  time: string;
  content: string;
  type: string;
  attivita: string;
}) {
  const getTypeClass = (type: string) => {
    switch (type) {
      case "first":
        return "rounded-t-xl";
      case "single":
        return "rounded-xl";
      case "last":
        return "rounded-b-xl border-t";
      default:
        return "border-t border-b";
    }
  };

  return (
    <div
      className={`transition-all overflow-hidden border-secondary relative p-4 ${getTypeClass(type)}`}
    >
      <div
        className={
          "bg-secondary -z-10 opacity-25 absolute top-0 bottom-0 left-0 right-0"
        }
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text font-semibold ph-censor-text">{subject.split("-")[0]}</p>
          <div className="text-accent flex flex-col">
            <span className="opacity-70 text-sm ph-censor-text">{(type == "first" || type == "single") && `${time}° ora •`} {teachers} • {attivita}</span>
          </div>
        </div>
      </div>
      {content && (<div className="relative overflow-hidden p-2 rounded-md mt-3">
        <div className="absolute bg-accent -z-10 opacity-35 top-0 left-0 right-0 bottom-0" />
        <span className="ph-censor-text" style={{ whiteSpace: "pre-wrap" }}>{content}</span>
      </div>)}
    </div>
  );
}

export default Page;
