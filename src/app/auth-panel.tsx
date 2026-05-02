"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-md">
      <h2 className="text-2xl font-semibold text-slate-900">Sign in to pick</h2>
      <p className="mt-2 text-sm text-slate-600">
        Create an account or sign in to keep your picks across sessions.
      </p>
      {searchParams.get("reauth") === "1" ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          Your session expired. Sign in again; non-sensitive draft context can be restored.
        </p>
      ) : null}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === "signin" ? "default" : "outline"}
          className={
            mode === "signin" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-300"
          }
          onClick={() => setMode("signin")}
        >
          Sign in
        </Button>
        <Button
          type="button"
          variant={mode === "signup" ? "default" : "outline"}
          className={
            mode === "signup" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-300"
          }
          onClick={() => setMode("signup")}
        >
          Create account
        </Button>
      </div>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="border-slate-200"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-emerald-600 py-5 text-base font-semibold hover:bg-emerald-700"
          disabled={submitting}
        >
          {submitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
      {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}
    </section>
  );
}
