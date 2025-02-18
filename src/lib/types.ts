export type Notification = {
    id: string;
    title: string;
    content: string;
    expiryDate: string;
    createDate: string;
    type: string;
    viewCount?: number;
    link: string | null;
    linkTitle: string | null;
}

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
    id: string;
    codice: number;
    titolo: string;
    testo: string;
    data_start: string;
    data_stop: string;
    tipo_com: string;
    tipo_com_filtro: string;
    tipo_com_desc: string;
    nome_file: string | null;
    richieste: string;
    id_relazione: string;
    conf_lettura: string;
    flag_risp: string;
    testo_risp: string | null;
    file_risp: string | null;
    flag_accettazione: string;
    modificato: string;
    evento_data: string;
}