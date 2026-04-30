"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Matchup = {
  id: string;
  playerA: string;
  playerB: string;
  projectedA: number;
  projectedB: number;
};

type ActiveSlate = {
  id: string;
  label: string;
  lockAt: string;
  status: "draft" | "open" | "locked" | "resolved";
  matchups: Matchup[];
};

export function SessionTools() {
  const [activeSlate, setActiveSlate] = useState<ActiveSlate | null>(null);
  const [picks, setPicks] = useState<Record<string, "A" | "B">>({});
  const [slateStatus, setSlateStatus] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isLoadingSlate, setIsLoadingSlate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const router = useRouter();

  const picksCompletedCount = useMemo(() => {
    if (!activeSlate) return 0;
    return activeSlate.matchups.reduce((total, matchup) => {
      return total + (picks[matchup.id] ? 1 : 0);
    }, 0);
  }, [activeSlate, picks]);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  async function submitPicks() {
    if (readOnly) {
      setSubmitStatus("This slate is locked. Picks are now read-only.");
      return;
    }
    if (!activeSlate) {
      setSubmitStatus("Load an active slate before submitting.");
      return;
    }
    if (picksCompletedCount !== activeSlate.matchups.length) {
      setSubmitStatus("Pick a player in every matchup before submitting.");
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus("Submitting picks...");
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slateId: activeSlate.id,
        picks,
      }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setIsSubmitting(false);
    if (!response.ok) {
      setSubmitStatus(data.error ?? "Unable to submit picks.");
      return;
    }
    setSubmitStatus(data.message ?? "Picks submitted successfully.");
  }

  async function loadSavedSubmission(slateId: string) {
    const response = await fetch(`/api/submissions?slateId=${encodeURIComponent(slateId)}`);
    const data = (await response.json()) as {
      error?: string;
      submission?: {
        picks: Record<string, "A" | "B">;
      } | null;
    };
    if (!response.ok) {
      setSubmitStatus(data.error ?? "Unable to restore your saved picks.");
      return;
    }
    if (data.submission?.picks) {
      setPicks(data.submission.picks);
      setSubmitStatus("Restored your previously submitted picks.");
    }
  }

  async function loadActiveSlate() {
    setIsLoadingSlate(true);
    setSlateStatus("Loading active slate...");
    const response = await fetch("/api/slates/active");
    const data = (await response.json()) as {
      error?: string;
      emptyState?: string;
      slate?: ActiveSlate | null;
      readOnly?: boolean;
    };
    setIsLoadingSlate(false);

    if (!response.ok) {
      setSlateStatus(data.error ?? "Unable to load active slate.");
      setActiveSlate(null);
      return;
    }

    if (!data.slate) {
      setActiveSlate(null);
      setReadOnly(false);
      setSlateStatus(data.emptyState ?? "No active slate.");
      return;
    }

    setActiveSlate(data.slate);
    setReadOnly(Boolean(data.readOnly));
    setPicks({});
    setSubmitStatus(null);
    setSlateStatus(
      data.readOnly ? "Latest slate loaded in read-only mode (lock has passed)." : "Active slate loaded.",
    );
    await loadSavedSubmission(data.slate.id);
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

  function pick(matchupId: string, side: "A" | "B") {
    setPicks((current) => ({
      ...current,
      [matchupId]: side,
    }));
    setSubmitStatus(null);
  }

  return (
    <section className="w-full rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/20 dark:bg-black">
      <h2 className="text-xl font-semibold">Close Call picks</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Make one pick per matchup, then submit before lock.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-black/20 px-4 py-2 text-sm disabled:opacity-60"
          onClick={loadActiveSlate}
          disabled={isLoadingSlate}
        >
          {isLoadingSlate ? "Loading slate..." : "Reload active slate"}
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
          <p>Status: {activeSlate.status}</p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Picks completed: {picksCompletedCount}/{activeSlate.matchups.length}
          </p>
          {readOnly ? (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Slate is locked. Picks are displayed in read-only mode.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-black/20 p-3 text-sm dark:border-white/20">
          No active slate is currently published.
        </div>
      )}
      {activeSlate ? (
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {activeSlate.matchups.map((matchup, index) => (
            <li key={matchup.id} className="rounded-md border border-black/10 p-3 dark:border-white/20">
              <p className="text-sm font-medium">Matchup {index + 1}</p>
              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-sm ${
                    picks[matchup.id] === "A"
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-black/20"
                  }`}
                  onClick={() => pick(matchup.id, "A")}
                  disabled={readOnly}
                >
                  {matchup.playerA} ({matchup.projectedA.toFixed(1)} proj)
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-sm ${
                    picks[matchup.id] === "B"
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-black/20"
                  }`}
                  onClick={() => pick(matchup.id, "B")}
                  disabled={readOnly}
                >
                  {matchup.playerB} ({matchup.projectedB.toFixed(1)} proj)
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          onClick={submitPicks}
          disabled={!activeSlate || isSubmitting || readOnly}
        >
          {isSubmitting ? "Submitting..." : "Submit picks"}
        </button>
        <button
          type="button"
          className="rounded-md border border-black/20 px-4 py-2 text-sm"
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
      {submitStatus ? <p className="mt-3 text-sm">{submitStatus}</p> : null}
    </section>
  );
}
