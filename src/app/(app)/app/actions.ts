"use server";

import { handleAuthError } from "@/lib/api";
import { AgendaItemType, GradeType, Notification } from "@/lib/types";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getMarks, getPresence } from "./register/actions";
import { getUserDetailsFromToken } from "@/lib/utils";
import { verifySession } from "@/app/(auth)/actions";
import { robustFetchJson } from "@/lib/fetch";

const API_BASE = "https://web.spaggiari.eu/rest/v1";
const USER_AGENT = "CVVS/std/4.1.7 Android/10";
const API_KEY = "Tg1NWEwNGIgIC0K";

function getHeaders(token: string) {
  return {
    "User-Agent": USER_AGENT,
    "Z-Dev-Apikey": API_KEY,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function getUserDetails() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const data = await robustFetchJson<{ school?: { name?: string }; schoolName?: string }>(`${API_BASE}/users/me`, {
      headers: getHeaders(token),
    });

    return {
      schoolName: data?.school?.name || data?.schoolName || null,
    };
  } catch (error) {
    console.error("[getUserDetails] Errore nel recupero dei dettagli utente:", error);
    return null;
  }
}

export async function getDayAgenda(date: Date) {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  const token = cookies().get("token")?.value;
  if (!token) return handleAuthError();

  // Calcolo date in ISO per filtro
  const start = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString();

  try {
    const data = await robustFetchJson<AgendaItemType[]>(`${API_BASE}/agenda/student?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
      method: "GET",
      headers: getHeaders(token),
    });
    // Filtra solo note (tipo === "nota")
    return data.filter((item: AgendaItemType) => item.tipo === "nota");
  } catch {
    return handleAuthError();
  }
}

export async function getDayLessons(date: Date) {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  const token = cookies().get("token")?.value;
  if (!token) return handleAuthError();

  const formattedDate = date.toISOString().split("T")[0];

  try {
    const json = await robustFetchJson<{ data?: unknown[] }>(`${API_BASE}/lessons/student?date=${formattedDate}`, {
      method: "GET",
      headers: getHeaders(token),
    });
    return json.data || [];
  } catch {
    return handleAuthError();
  }
}

// SERVER-DATA-SECTION
export async function getAllNotifications(): Promise<Notification[] | null> {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  try {
    const notifications = await db.notifications.findMany({
      where: {
        expiryDate: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        createDate: true,
        expiryDate: true,
        title: true,
        content: true,
        type: true,
        link: true,
        linkTitle: true,
      },
    });
    if (!notifications) {
      return [];
    }
    return notifications.map((notification) => ({
      ...notification,
      expiryDate: notification.expiryDate.toISOString(),
      createDate: notification.createDate.toISOString(),
    }));
  } catch (e) {
    console.log(e);
    return handleAuthError();
  }
}

export async function getNotificationDetails(id: string) {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  try {
    const notification = await db.notifications.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        createDate: true,
        expiryDate: true,
        title: true,
        content: true,
        type: true,
        link: true,
        linkTitle: true,
      },
    });
    return notification;
  } catch {
    return handleAuthError();
  }
}

export async function setNotificationAsRead({ notificationId }: { notificationId: string }) {
  try {
    if (!notificationId) {
      return handleAuthError();
    }
    const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
    if (!userData) {
      return handleAuthError();
    }
    if (!(await verifySession())) {
      return handleAuthError();
    }
    await db.notifications.update({
      where: { id: notificationId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
    return;
  } catch {
    return handleAuthError();
  }
}

export async function updateServerData() {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  if (!(await verifySession())) {
    return handleAuthError();
  }
  const user = await db.user.findUnique({
    where: { id: userData.uid },
  });

  if (!user?.hasAcceptedSocialTerms) {
    return;
  }

  if (!user.school) {
  const school = await getUserDetails();
    if (school) {
      await db.user.update({
        where: { id: user.id },
        data: {
          school: school.schoolName,
        },
      });
    }
  }

  if (!user.average) {
    updateServerAverage(user.id);
  }
  if (!user.absencesHours || !user.delays) {
    updateServerPresenceData(user.id);
  }

  if (!user.name) {
    return "username_not_set";
  }

  const lastUpdate = user?.lastServerDataUpdate ? new Date(user.lastServerDataUpdate) : null;
  if (lastUpdate && new Date().getTime() - lastUpdate.getTime() < 8 * 60 * 60 * 1000) {
    return "updated";
  }

  updateServerAverage(user.id);
  updateServerPresenceData(user.id);
}

async function updateServerAverage(userId: string) {
  const marks: GradeType[] = (await getMarks()) as GradeType[];
  const totalAverage =
    marks.filter((mark) => mark.color !== "blue").reduce((acc, mark) => acc + mark.decimalValue, 0) /
    marks.filter((mark) => mark.color !== "blue").length;
  await db.user.update({
    where: { id: userId },
    data: {
      average: totalAverage,
      lastServerDataUpdate: new Date(),
    },
  });
}

async function updateServerPresenceData(userId: string) {
  const presenceData = await getPresence();
  if (presenceData && presenceData.delaysNumber !== undefined && presenceData.absenceHours !== undefined) {
    await db.user.update({
      where: { id: userId },
      data: {
        delays: presenceData.delaysNumber,
        absencesHours: presenceData.absenceHours,
        lastServerDataUpdate: new Date(),
      },
    });
  }
}

export async function setUserName(username: string) {
  const userData = await getUserDetailsFromToken(cookies().get("internal_token")?.value || "");
  if (!userData) {
    return handleAuthError();
  }
  if (username.length > 13) {
    return "Username troppo lungo, massimo 13 caratteri.";
  }
  if (!/^[a-zA-Z0-9-_.!]+$/.test(username)) {
    return "L'username può contenere solo lettere, numeri, trattini, underscore, punti e punti esclamativi.";
  }
  if (username.toLowerCase() === "anonimo") {
    return "Questo username è riservato.";
  }
  if (!(await verifySession())) {
    return handleAuthError();
  }
  try {
    await db.user.update({
      where: { id: userData.uid },
      data: {
        name: username,
      },
    });
  } catch (error) {
    if ((error as { code: string }).code === "P2002") {
      return "Questo username è già stato preso.";
    }
    throw error;
  }
}
