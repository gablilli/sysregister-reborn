"use client";
import Image from "next/legacy/image";
import AuthIcon from "@/assets/icons/auth.svg";
import Button from "@/components/Button";
import { Input, InputLabel } from "@/components/Input";
import { useCallback, useEffect, useState } from "react";
import { loginAndRedirect } from "./actions";
import { useSearchParams } from "next/navigation";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";

export default function Page() {
  const goTo = useSearchParams().get("goto");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Returns true if url is a relative path starting with "/", and not with "//"
  function isSafeRedirect(url: string | undefined | null): boolean {
    return (
      typeof url === "string" &&
      url.startsWith("/") &&
      !url.startsWith("//") &&
      !url.startsWith("/\\") && // defensive for windows paths
      !url.includes("://")     // disallow schemes
    );
  }

  function showError(errorMessage: string) {
    setError(errorMessage);
    setLoading(false);
    setTimeout(() => {
      setError("");
    }, 3000);
  }

  const trySignIn = useCallback(
    async (formData: FormData) => {
      const uid = formData.get("sysregister-username") as string;
      const pass = formData.get("sysregister-password") as string;
      console.log("[CLIENT] Attempting login with uid:", uid);
      setLoading(true);
      try {
        localStorage.setItem("username", uid);
        localStorage.setItem("password", pass);
        const result = await loginAndRedirect({ uid, pass, redirectTo: goTo });
        
        if (result.error) {
          console.error("[CLIENT] Login failed:", result.error);
          showError(result.error);
          return;
        }
        
        if (result.success && result.redirectTo) {
          console.log("[CLIENT] Login successful, redirecting to:", result.redirectTo);
          // Use window.location for a full page reload to ensure cookies are properly set, but only with validated paths
          const safeRedirect = isSafeRedirect(result.redirectTo) ? result.redirectTo : "/";
          window.location.href = safeRedirect;
        } else {
          console.error("[CLIENT] Unexpected response:", result);
          showError("Si è verificato un errore durante l'accesso");
        }
      } catch (err) {
        console.error("[CLIENT] Exception during login:", err);
        showError("Si è verificato un errore durante l'accesso");
        setLoading(false);
      }
    },
    [goTo]
  );

  const tryAutoSignIn = useCallback(
    async () => {
      const uid = localStorage.getItem("username");
      const pass = localStorage.getItem("password");
      if (!uid || !pass) return;
      
      console.log("[CLIENT] Attempting auto-login with uid:", uid);
      setLoading(true);
      try {
        const result = await loginAndRedirect({ uid, pass, redirectTo: goTo });
        
        if (result.error) {
          console.error("[CLIENT] Auto-login failed:", result.error);
          // Don't show error for auto-login failure - just let user login manually
          setLoading(false);
          return;
        }
        
        if (result.success && result.redirectTo) {
          console.log("[CLIENT] Auto-login successful, redirecting to:", result.redirectTo);
          // Use window.location for a full page reload to ensure cookies are properly set, but only with validated paths
          const safeRedirect = isSafeRedirect(result.redirectTo) ? result.redirectTo : "/";
          window.location.href = safeRedirect;
        } else {
          console.error("[CLIENT] Unexpected auto-login response:", result);
          setLoading(false);
        }
      } catch (err) {
        console.error("[CLIENT] Exception during auto-login:", err);
        // Don't show error for auto-login failure - just let user login manually
        setLoading(false);
      }
    },
    [goTo]
  );

  useEffect(() => {
    if (localStorage.getItem("username") && localStorage.getItem("password")) {
      tryAutoSignIn();
    }
  }, [tryAutoSignIn]);

  return (
    <div className="flex flex-col items-center justify-center h-svh">
      <div className="flex items-center justify-center flex-col flex-1">
        <div className="relative overflow-hidden p-9 rounded-[55px] shadow mb-6">
          <div className="bg-secondary absolute opacity-45 -z-10 top-0 right-0 bottom-0 left-0" />
          <Image
            src={AuthIcon}
            width={100}
            height={100}
            alt="Authentication Icon"
          />
        </div>
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-accent">Autenticati</p>
          <p className="text-secondary text-sm">Inserisci le tue credenziali classeviva per fare l&apos;accesso</p>
        </div>
      </div>
      <div className="flex-1 flex w-full px-6 items-center flex-col justify-end">
        <div className="p-4 px-0 w-full">
          <InstallPWAPrompt />
        </div>
        <form
          className="w-full"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await trySignIn(formData);
          }}
        >
          <div className="w-full">
            <InputLabel text={"Nome utente"} />
            <Input name="sysregister-username" placeholder="G123456789P" />
          </div>
          <div className="w-full mt-4">
            <InputLabel text={"Password"} />
            <Input
              name="sysregister-password"
              placeholder="••••••••••••••"
              type="password"
            />
          </div>
          <span className="text-accent text-left text-sm mt-1 w-full">
            {error.toString()}
          </span>
          <Button loading={loading} className="w-full mt-7">
            Accesso
          </Button>
          <p className="text-sm text-center text-secondary py-5 pb-8">
            Non hai queste credenziali?{" "}
            <a
              href="https://web.spaggiari.eu/home/app/default/login.php"
              target="_blank"
            >
              <u>recuperale</u>
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
