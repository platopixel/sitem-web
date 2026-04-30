"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SessionTools() {
  const [contextValue, setContextValue] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("non_sensitive_pick_note") ?? "";
  });
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  async function saveCanonicalSubmission() {
    localStorage.setItem("non_sensitive_pick_note", contextValue);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slateId: "week-1-mock",
        payload: {
          note: contextValue || "empty-note",
        },
      }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setStatus(data.error ?? "Unable to save submission.");
      return;
    }
    setStatus(data.message ?? "Saved.");
  }

  return (
    <section className="w-full max-w-lg rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/20 dark:bg-black">
      <h2 className="text-xl font-semibold">Phase 1 session and persistence check</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This stores a non-sensitive draft note locally and upserts one canonical submission per user/slate.
      </p>
      <label className="mt-4 block text-sm" htmlFor="context">
        Non-sensitive draft note
      </label>
      <input
        id="context"
        className="mt-1 w-full rounded-md border border-black/20 p-2 text-sm"
        value={contextValue}
        onChange={(event) => setContextValue(event.target.value)}
        placeholder="Example: leaning WR in matchup #2"
      />
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          onClick={saveCanonicalSubmission}
        >
          Save canonical submission
        </button>
        <button
          type="button"
          className="rounded-md border border-black/20 px-4 py-2 text-sm"
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
      {status ? <p className="mt-3 text-sm">{status}</p> : null}
    </section>
  );
}
