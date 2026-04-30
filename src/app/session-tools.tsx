"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SessionTools() {
  const [contextValue, setContextValue] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("non_sensitive_pick_note") ?? "";
  });
  const [activeSlate, setActiveSlate] = useState<{
    id: string;
    label: string;
    lockAt: string;
    matchups: { id: string; playerA: string; playerB: string; projectedA: number; projectedB: number }[];
  } | null>(null);
  const [slateStatus, setSlateStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  async function saveCanonicalSubmission() {
    localStorage.setItem("non_sensitive_pick_note", contextValue);
    const currentSlateId = activeSlate?.id ?? "week-1-mock";
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slateId: currentSlateId,
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

  async function loadActiveSlate() {
    const response = await fetch("/api/slates/active");
    const data = (await response.json()) as {
      error?: string;
      emptyState?: string;
      slate?: {
        id: string;
        label: string;
        lockAt: string;
        matchups: { id: string; playerA: string; playerB: string; projectedA: number; projectedB: number }[];
      } | null;
    };

    if (!response.ok) {
      setSlateStatus(data.error ?? "Unable to load active slate.");
      setActiveSlate(null);
      return;
    }

    if (!data.slate) {
      setActiveSlate(null);
      setSlateStatus(data.emptyState ?? "No active slate.");
      return;
    }

    setActiveSlate(data.slate);
    setSlateStatus("Active slate loaded.");
  }

  async function publishMockSlate() {
    const lockAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const label = `Week ${new Date().getUTCDate()} Mock`;
    const response = await fetch("/api/admin/slates/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": "dev-admin",
      },
      body: JSON.stringify({ label, lockAt }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setSlateStatus(data.error ?? "Unable to publish slate.");
      return;
    }
    setSlateStatus("Mock slate published.");
    await loadActiveSlate();
  }

  return (
    <section className="w-full max-w-lg rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/20 dark:bg-black">
      <h2 className="text-xl font-semibold">Phase 1 session and persistence check</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This stores a non-sensitive draft note locally, upserts one canonical submission per user/slate, and reads the active slate.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-black/20 px-4 py-2 text-sm"
          onClick={loadActiveSlate}
        >
          Load active slate
        </button>
        <button
          type="button"
          className="rounded-md border border-black/20 px-4 py-2 text-sm"
          onClick={publishMockSlate}
        >
          Publish mock slate (admin)
        </button>
      </div>
      {slateStatus ? <p className="mt-3 text-sm">{slateStatus}</p> : null}
      {activeSlate ? (
        <div className="mt-3 rounded-md border border-black/10 p-3 text-sm dark:border-white/20">
          <p>
            Active slate: <span className="font-medium">{activeSlate.label}</span>
          </p>
          <p>Lock deadline: {new Date(activeSlate.lockAt).toLocaleString()}</p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Matchups: {activeSlate.matchups.length} published
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-black/20 p-3 text-sm dark:border-white/20">
          No active slate is currently published.
        </div>
      )}
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
