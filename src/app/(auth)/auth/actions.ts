"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserSession } from "./action";

export default function AuthPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await getUserSession({ uid, pass });

    if (typeof result === "string") {
      setError(result);
    } else {
      setError(null);
      localStorage.setItem("uid", uid);
      localStorage.setItem("password", pass);
      router.push("/dashboard");
    }
  }

  function showError(msg: string) {
    alert(msg);
  }

  if (error) {
    showError(error);
    setError(null);
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        placeholder="UID"
      />
      <input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
