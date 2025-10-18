"use server";
import { cookies } from "next/headers";
import { JSDOM } from "jsdom";
import { GradeType, PeriodType, Subject } from "@/lib/types";
import { handleAuthError } from "@/lib/api";
import { getUserDetailsFromToken } from "@/lib/utils";

export async function getPeriods(inputPage?: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    let page;
    if (inputPage) {
        page = inputPage;
    } else {
        page = await (await fetch("https://web.spaggiari.eu/cvv/app/default/genitori_voti.php", {
            headers: {
                "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
            },
        })).text();
    }
    const dom = new JSDOM(page);
    try {
        const periodsContainer = dom.window.document.querySelector("ul");

        const periods: PeriodType[] = [];
        if (periodsContainer) {
            Array.from(periodsContainer.children).map((period, i) => {
                periods.push({
                    periodCode: (period.children[0] as HTMLAnchorElement)?.href.split("#")[1] || "",
                    periodPos: i + 1,
                    periodDesc: period.textContent || "",
                });
            });
        }
        return periods;
    } catch {
        return handleAuthError();
    }
}

const markTable: { [key: string]: number } = {
    "1": 1, "1+": 1.25, "1½": 1.5, "2-": 1.75, "2": 2, "2+": 2.25, "2½": 2.5,
    "3-": 2.75, "3": 3, "3+": 3.25, "3½": 3.5, "4-": 3.75, "4": 4, "4+": 4.25,
    "4½": 4.5, "5-": 4.75, "5": 5, "5+": 5.25, "5½": 5.5, "6-": 5.75, "6": 6,
    "6+": 6.25, "6½": 6.5, "7-": 6.75, "7": 7, "7+": 7.25, "7½": 7.5, "8-": 7.75,
    "8": 8, "8+": 8.25, "8½": 8.5, "9-": 8.75, "9": 9, "9+": 9.25, "9½": 9.5,
    "10-": 9.75, "10": 10
};

export async function getMarks(inputPage?: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    let page;
    if (inputPage) {
        page = inputPage;
    } else {
        page = await (await fetch("https://web.spaggiari.eu/cvv/app/default/genitori_voti.php", {
            headers: {
                "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
            },
        })).text();
    }
    const dom = new JSDOM(page);

    try {
        const periods = await getPeriods();
        if (!periods) {
            return [];
        };
        const marks: GradeType[] = [];
        periods.map(async (period) => {
            const rawPeriodTable = dom.window.document.querySelector(`table[sessione=${period.periodCode}]`)?.querySelector("tbody");
            const subjectIds = Array.from(rawPeriodTable?.children || [])
                .filter((row) => row.children.length > 1 && row.classList.contains("riga_competenza_default"))
                .map((row) => row.getAttribute("materia_id"));
            const periodTable = Array.from(rawPeriodTable?.children || [])
                .filter((row) => row.children.length > 1 && row.classList.contains("riga_materia_componente"));
            periodTable.map((row, subjectIndex) => {
                const subjectName = row.children[0].textContent?.trim().toUpperCase() || "";
                const grades = Array.from(row.children).filter((cell) => cell.classList.contains("cella_voto"));
                grades.map((grade) => {
                    marks.push({
                        subjectId: Number(subjectIds[subjectIndex]) || 0,
                        subjectDesc: subjectName.trim(),
                        evtId: Number(grade.getAttribute("evento_id")) || 0,
                        evtDate: grade.children[0].textContent?.trim() || "",
                        decimalValue: markTable[grade.children[1].textContent?.trim() || "-"] || 0,
                        displayValue: grade.children[1].textContent?.trim() || "-",
                        color: grade.children[1].classList.contains("f_reg_voto_dettaglio") ? "blue" : "green",
                        periodDesc: period.periodDesc,
                        componentDesc: grade.children[1].getAttribute("title") || "",
                    });
                });
            });
        });
        return marks;
    } catch {
        return handleAuthError();
    }
}


export async function getPresence(inputPage?: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    let page;
    if (inputPage) {
        page = inputPage;
    } else {
        page = await (await fetch("https://web.spaggiari.eu/tic/app/default/consultasingolo.php#eventi", {
            headers: {
                "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
            },
        })).text();
    }
    const dom = new JSDOM(page);
    try {
        const absenceHours = dom.window.document.querySelector(`td.griglia_sep_gray[colspan='17']`)?.querySelector(".double")?.textContent?.split(":")[1].split("(")[0].trim() || "";
        const delaysNumber = dom.window.document.querySelector(`tr.rigtab[height='57']`)?.children[8]?.querySelector(".double")?.textContent?.trim() || "";
        return {
            absenceHours: parseFloat(absenceHours) || 0,
            delaysNumber: parseFloat(delaysNumber) || 0,
        };
    } catch {
        return handleAuthError();
    }
}

export async function getMarkNotes(evtId: number) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const page = await (await fetch(`https://web.spaggiari.eu/cvv/app/default/genitori_voti.php?ope=voto_detail&evento_id=${evtId}`, {
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
        },
    })).text();
    const dom = new JSDOM(page);

    try {
        const notesContainer = dom.window.document.querySelector("td[colspan='5']");
        const notes = notesContainer?.textContent?.trim() || "";
        return notes;
    } catch {
        return handleAuthError();
    }
}

export async function getSubject(subjectName: string) {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const subjectIdPage = await (await fetch(`https://web.spaggiari.eu/fml/app/default/regclasse_lezioni_xstudenti.php`, {
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
        },
    })).text();
    const subjectIdDom = new JSDOM(subjectIdPage);

    try {
        const subjectNameResult = subjectIdDom.window.document.querySelector(`div[title*='${decodeURIComponent(subjectName)}']`)?.textContent;
        const subjectId = subjectIdDom.window.document.querySelector(`div[title*='${decodeURIComponent(subjectName)}']`)?.getAttribute("materia_id");
        const autoriId = subjectIdDom.window.document.querySelector(`div[title*='${decodeURIComponent(subjectName)}']`)?.getAttribute("autori_id");
        if (!subjectNameResult || !subjectId || !autoriId) {
            return [];
        }
        const subject: Subject = {
            id: Number(subjectId),
            name: subjectNameResult,
            teachers: [],
        };
        return subject;
    } catch {
        return handleAuthError();
    }
}

export async function getUserPresenceData() {

}

// combined functions
export async function getMarksAndPeriods() {
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
        return handleAuthError();
    }
    const page = await (await fetch("https://web.spaggiari.eu/cvv/app/default/genitori_voti.php", {
        headers: {
            "Cookie": `PHPSESSID=${cookies().get("token")?.value}; webidentity=${userData.uid};`,
        },
    })).text();
    const marks = await getMarks(page);
    const periods = await getPeriods(page);
    return { marks, periods };
}