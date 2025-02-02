import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'CVVS/std/4.1.7 Android/10',
    'Z-Dev-Apikey': 'Tg1NWEwNGIgIC0K',
    'ContentsDiary-Type': 'application/json',
}

async function handleAuthError(response: Response) {
    if (response.status === 401) {
        cookies().delete("token");
        cookies().delete("tokenExpiry");
        cookies().delete("uid");
        redirect("/auth");
    }
}

export async function get(url: string) {
    const token = cookies().get("token");
    const headers = token ? { ...defaultHeaders, "Z-Auth-Token": token.value } : defaultHeaders;
    const response = await fetch(`${process.env.CLASSEVIVA_API_BASE_URL}${url}`, { headers });
    if (!response.ok) {
        await handleAuthError(response);
    }
    return (await response.json());
}

export async function post(url: string, body?: object) {
    const token = cookies().get("token");
    const headers = token ? { ...defaultHeaders, "Z-Auth-Token": token.value } : defaultHeaders;
    const response = await fetch(`${process.env.CLASSEVIVA_API_BASE_URL}${url}`, {
        headers,
        method: "POST",
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        await handleAuthError(response);
    }
    return (await response.json());
}

export function formatDate(date: Date) {
    return `${date.getFullYear()}${(date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1)}${date.getDate() < 10 ? '0' : ''}${date.getDate()}`;
}