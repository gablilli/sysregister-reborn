export type AgendaItemType = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    data_inserimento: string;
    nota_2: string;
    master_id: string | null;
    classe_id: string;
    classe_desc: string;
    gruppo: number;
    autore_desc: string;
    autore_id: string;
    tipo: string;
    materia_desc: string | null;
    materia_id: string | null;
    id_compito: string | null;
    completed?: boolean;
}

export type Subject = {
    id: number;
    name: string;
    teachers: string[];
    marks?: GradeType[]; 
}

export type Subjects = Subject[];

export type LessonType = {
    docente: string;
    classe_desc: string;
    materia_desc: string;
    materia_codice: string;
    attivita: string;
    argomento: string;
    ora: string;
    stato_ora: string;
    stato_ora_desc: string;
    bg_color_stato: string;
    font_color_stato: string;
    allegati: AttachmentType[];
}

export type GradeType = {
    subjectId: number;
    subjectDesc: string;
    evtId: number;
    evtDate: string;
    decimalValue: number;
    displayValue: string;
    color: string;
    periodDesc: string;
    componentDesc: string;
}

export type PeriodType = {
    periodCode: string;
    periodPos: number;
    periodDesc: string;
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