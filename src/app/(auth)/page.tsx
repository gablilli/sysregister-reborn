"use client";
import Image from "next/legacy/image";
import AuthIcon from "@/assets/icons/auth.svg";
import Button from "@/components/Button";
import { Input, InputLabel } from "@/components/Input";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";

export default function Page() {
  const goTo = useSearchParams().get("goto");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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
        
        // Call API route instead of server action
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid, pass }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          console.error("[CLIENT] Login failed:", data.error);
          showError(data.error || "Si è verificato un errore durante l'accesso");
          return;
        }

        if (data.success) {
          console.log("[CLIENT] Login successful, redirecting to app");
          // Success - redirect to app
          const redirectTo = goTo && ["/app", "/app/profile", "/app/register"].includes(goTo) 
            ? goTo 
            : "/app";
          window.location.href = redirectTo;
        } else {
          console.error("[CLIENT] Login failed - unexpected response");
          showError("Si è verificato un errore durante l'accesso");
        }
      } catch (err) {
        console.error("[CLIENT] Login error:", err);
        showError("Errore durante l'autenticazione. Riprova più tardi.");
        setLoading(false);
      }
    },
    [goTo]
  );



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
