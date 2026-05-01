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

type ResolvedSubmission = {
  userId: string;
  slateId: string;
  correct: number;
  total: number;
  resolvedAt: string;
  matchups: Array<{
    matchupId: string;
    winner: "A" | "B" | "void";
    actualA: number | null;
    actualB: number | null;
    policy: "normal" | "postponed";
    userPick: "A" | "B" | null;
    isCorrect: boolean | null;
  }>;
};

export function SessionTools() {
  const [activeSlate, setActiveSlate] = useState<ActiveSlate | null>(null);
  const [picks, setPicks] = useState<Record<string, "A" | "B">>({});
  const [slateStatus, setSlateStatus] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isLoadingSlate, setIsLoadingSlate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [resolved, setResolved] = useState<ResolvedSubmission | null>(null);
  const [auditEmail, setAuditEmail] = useState("");
  const [auditSlateId, setAuditSlateId] = useState("");
  const [auditStatus, setAuditStatus] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
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
      resolved?: ResolvedSubmission | null;
    };
    if (!response.ok) {
      setSubmitStatus(data.error ?? "Unable to restore your saved picks.");
      return;
    }
    if (data.submission?.picks) {
      setPicks(data.submission.picks);
      setSubmitStatus("Restored your previously submitted picks.");
    }
    setResolved(data.resolved ?? null);
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
      setResolved(null);
      setSlateStatus(data.emptyState ?? "No active slate.");
      return;
    }

    setActiveSlate(data.slate);
    setReadOnly(Boolean(data.readOnly));
    setPicks({});
    setResolved(null);
    setSubmitStatus(null);
    setSlateStatus(
      data.readOnly ? "Latest slate loaded in read-only mode (lock has passed)." : "Active slate loaded.",
    );
    await loadSavedSubmission(data.slate.id);
  }

  async function resolveMockResults() {
    if (!activeSlate) {
      setSlateStatus("Load a slate before resolving results.");
      return;
    }
    let forceLockNow = false;
    if (activeSlate.status === "open") {
      const shouldLockAndResolve = window.confirm(
        "This slate is still open. Lock it now and resolve mock results immediately?",
      );
      if (!shouldLockAndResolve) {
        setSlateStatus("Resolve canceled.");
        return;
      }
      forceLockNow = true;
    }
    const answerKey = activeSlate.matchups.map((matchup, index) => {
      if (index === 0) {
        return {
          matchupId: matchup.id,
          policy: "postponed" as const,
        };
      }
      return {
        matchupId: matchup.id,
        policy: "normal" as const,
        actualA: Number((matchup.projectedA + 1.5).toFixed(1)),
        actualB: Number((matchup.projectedB - 0.7).toFixed(1)),
      };
    });

    const response = await fetch("/api/admin/slates/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": "dev-admin",
      },
      body: JSON.stringify({
        slateId: activeSlate.id,
        forceLockNow,
        answerKey,
      }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setSlateStatus(data.error ?? "Unable to resolve mock results.");
      return;
    }
    setSlateStatus("Slate resolved from mock answer key.");
    await loadActiveSlate();
  }

  async function runSubmissionAudit() {
    const slateId = auditSlateId.trim();
    const email = auditEmail.trim();
    if (!slateId || !email) {
      setAuditStatus("Enter both user email and slate ID.");
      return;
    }
    setAuditLoading(true);
    setAuditStatus("Checking submission record...");
    const params = new URLSearchParams({ email, slateId });
    const response = await fetch(`/api/admin/users/audit?${params.toString()}`, {
      headers: { "x-admin-secret": "dev-admin" },
    });
    const data = (await response.json()) as {
      error?: string;
      submitted?: boolean;
      user?: { email: string; id: string } | null;
      slate?: { id: string; label: string } | null;
      submission?: { updatedAt?: string; pickCount?: number } | null;
    };
    setAuditLoading(false);
    if (!response.ok) {
      setAuditStatus(data.error ?? "Audit request failed.");
      return;
    }
    const userLine = data.user ? `${data.user.email} (${data.user.id})` : "User not registered";
    const slateLine =
      data.slate ? `${data.slate.label} (${data.slate.id})` : "Slate ID not found";
    const pickLine =
      data.submitted && data.submission?.updatedAt ?
        `Recorded ${data.submission.pickCount ?? "?"} matchup picks · ${new Date(data.submission.updatedAt).toLocaleString()}`
      : data.submitted ? "Recorded submission timestamps unavailable." : "No submission on file.";
    setAuditStatus(
      [`Support audit: submitted=${Boolean(data.submitted)}`, userLine, slateLine, pickLine].join(
        "\n",
      ),
    );
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
        <button
          type="button"
          className="rounded-md border border-black/20 px-4 py-2 text-sm"
          onClick={resolveMockResults}
        >
          Resolve mock results (admin)
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
      {resolved ? (
        <section className="mt-4 rounded-md border border-black/10 p-3 text-sm dark:border-white/20">
          <p className="font-medium">
            Results: {resolved.correct}/{resolved.total} correct
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Resolved at {new Date(resolved.resolvedAt).toLocaleString()}
          </p>
          <ol className="mt-2 grid gap-2 md:grid-cols-2">
            {resolved.matchups.map((item, index) => (
              <li key={item.matchupId} className="rounded border border-black/10 p-2 dark:border-white/20">
                <p className="font-medium">Matchup {index + 1}</p>
                <p>
                  Winner:{" "}
                  {item.winner === "void"
                    ? "Void (postponed)"
                    : item.winner === "A"
                      ? activeSlate?.matchups.find((m) => m.id === item.matchupId)?.playerA ?? "Player A"
                      : activeSlate?.matchups.find((m) => m.id === item.matchupId)?.playerB ?? "Player B"}
                </p>
                <p>
                  Your pick:{" "}
                  {item.userPick === null
                    ? "none"
                    : item.userPick === "A"
                      ? activeSlate?.matchups.find((m) => m.id === item.matchupId)?.playerA ?? "Player A"
                      : activeSlate?.matchups.find((m) => m.id === item.matchupId)?.playerB ?? "Player B"}
                </p>
                <p>
                  Outcome:{" "}
                  {item.isCorrect === null ? "No score (void matchup)" : item.isCorrect ? "Correct" : "Incorrect"}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <section className="mt-8 border-t border-black/10 pt-6 dark:border-white/15">
        <h3 className="text-lg font-semibold">Support audit (admin)</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Confirm whether an account submitted picks for a slate. Sends the usual admin secret header.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            User email
            <input
              type="email"
              className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
              value={auditEmail}
              onChange={(event) => setAuditEmail(event.target.value)}
              autoComplete="off"
              placeholder="player@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Slate ID
            <input
              type="text"
              className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
              value={auditSlateId}
              onChange={(event) => setAuditSlateId(event.target.value)}
              autoComplete="off"
              placeholder="slate_*"
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-3 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-200 dark:text-black"
          onClick={runSubmissionAudit}
          disabled={auditLoading}
        >
          {auditLoading ? "Checking..." : "Check submission"}
        </button>
        {auditStatus ?
          <pre className="mt-4 whitespace-pre-wrap rounded-md bg-zinc-100 p-3 text-xs dark:bg-white/10">
            {auditStatus}
          </pre>
        : null}
      </section>
    </section>
  );
}
