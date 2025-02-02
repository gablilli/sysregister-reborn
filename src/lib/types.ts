export type AgendaItemType = {
    evtId: number;
    evtCode: string;
    evtDatetimeBegin: string;
    evtDatetimeEnd: string;
    isFullDay: boolean;
    notes: string;
    authorName: string;
    classDesc: string;
    subjectId: number;
    subjectDesc: string;
    homeworkId: number | null;
    completed?: boolean;
}

export type Teacher = {
    teacherId: string;
    teacherName: string;
}

export type Subject = {
    id: number;
    description: string;
    order: number;
    teachers: Teacher[];
}

export type Subjects = Subject[];

export type LessonType = {
    id: number;
    date: string;
    subject: Subject;
    teacher: Teacher;
    startTime: string;
    endTime: string;
    room: string;
    notes: string;
}

export type GradeType = {
    subjectId: number;
    subjectCode: string;
    subjectDesc: string;
    evtId: number;
    evtCode: string;
    evtDate: string;
    decimalValue: number;
    displayValue: string;
    displaPos: number;
    notesForFamily: string;
    color: string;
    canceled: boolean;
    underlined: boolean;
    periodPos: number;
    periodDesc: string;
    componentPos: number;
    componentDesc: string;
    weightFactor: number;
    skillId: number;
    gradeMasterId: number;
    skillDesc: string | null;
    skillCode: string | null;
    skillMasterId: number;
    skillValueDesc: string;
    skillValueShortDesc: string | null;
    oldskillId: number;
    oldskillDesc: string;
}

export type PeriodType = {
    periodCode: string;
    periodPos: number;
    periodDesc: string;
    isFinal: boolean;
    dateStart: string;
    dateEnd: string;
    miurDivisionCode: string | null;
}