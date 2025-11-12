import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function handleAuthError() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    cookieStore.delete("tokenExpiry");
    cookieStore.delete("internal_token");
    redirect(`/auth`);
}