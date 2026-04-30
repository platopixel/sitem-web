"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "signin" | "signup";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(data.error ?? "Authentication failed.");
      setSubmitting(false);
      return;
    }

    setStatus("Success. Session started.");
    setSubmitting(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/20 dark:bg-black">
      <h1 className="text-2xl font-semibold">Close Call Fantasy Picks</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Create an account or sign in to keep your picks across sessions.
      </p>
      {searchParams.get("reauth") === "1" ? (
        <p className="mt-4 rounded-md bg-amber-100 p-2 text-sm text-amber-950">
          Your session expired. Sign in again; non-sensitive draft context can be restored.
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          className={`rounded-md px-3 py-1 text-sm ${mode === "signin" ? "bg-black text-white dark:bg-white dark:text-black" : "border border-black/20"}`}
          onClick={() => setMode("signin")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`rounded-md px-3 py-1 text-sm ${mode === "signup" ? "bg-black text-white dark:bg-white dark:text-black" : "border border-black/20"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Create account
        </button>
      </div>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded-md border border-black/20 p-2 text-sm"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-black/20 p-2 text-sm"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
        <button
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      {status ? <p className="mt-3 text-sm">{status}</p> : null}
    </section>
  );
}
