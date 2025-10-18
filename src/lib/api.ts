import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function handleAuthError() {
    (await cookies()).delete("token");
    (await cookies()).delete("tokenExpiry");
    (await cookies()).delete("internal_token");
    redirect(`/auth`);
}