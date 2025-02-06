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
    marks: GradeType[];
}

export type Subjects = Subject[];

export type LessonType = {
    evtId: number;
    evtDate: string;
    evtCode: string;
    evtHPos: number;
    evtDuration: number;
    classDesc: string;
    authorName: string;
    subjectId: number;
    subjectCode: string;
    subjectDesc: string;
    lessonType: string;
    lessonArg: string;
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

export type AttachmentType = {
    fileName: string;
    attachNum: number;
}

export type BachecaType = {
    pubId: number;
    pubDT: string;
    readStatus: boolean;
    evtCode: string;
    cntId: number;
    cntValidFrom: string;
    cntValidTo: string;
    cntValidInRange: boolean;
    cntStatus: string;
    cntTitle: string;
    cntCategory: string;
    cntHasChanged: boolean;
    cntHasAttach: boolean;
    needJoin: boolean;
    needReply: boolean;
    needFile: boolean;
    needSign: boolean;
    evento_id: string;
    dinsert_allegato: string;
    attachments: AttachmentType[];
}