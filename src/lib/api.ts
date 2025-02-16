import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function handleAuthError() {
    cookies().delete("token");
    cookies().delete("tokenExpiry");
    cookies().delete("internal_token");
    redirect(`/auth`);
}