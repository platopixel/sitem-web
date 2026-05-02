import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PicksShell } from "@/components/picks-shell";
import { Button } from "@/components/ui/button";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { getDefaultScoringAdapter, serializeScoringTransparency } from "@/lib/scoring";
import { getProfileHistorySnapshot } from "@/lib/profile-history";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
  if (!user) {
    redirect("/?reauth=1");
  }

  const snapshot = await getProfileHistorySnapshot(user.id);
  if (!snapshot) {
    redirect("/");
  }

  const { aggregates, history, memberSince } = snapshot;
  const defaultScoring = serializeScoringTransparency(getDefaultScoringAdapter());

  return (
    <PicksShell
      title="Profile & history"
      subtitle="Submitted slates, aggregate stats, and scoring transparency."
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Signed in as</p>
              <h2 className="text-2xl font-semibold text-slate-900">{snapshot.email}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Member since {new Date(memberSince).toLocaleDateString()}
              </p>
            </div>
            <Button
              asChild
              className="w-full shrink-0 bg-emerald-600 px-6 py-5 text-base font-semibold hover:bg-emerald-700 sm:w-auto sm:py-2"
            >
              <Link href="/">Back to picks</Link>
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Aggregate performance</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-emerald-50/40 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Slates with submitted picks
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{aggregates.slatesEntered}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-emerald-50/40 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Resolved slates scored
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{aggregates.slatesResolved}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-emerald-50/40 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Correct picks (resolved totals)
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {aggregates.totalCorrectAcrossResolved}
                <span className="text-lg font-normal text-slate-500">
                  {" "}
                  / {aggregates.totalPickSlotsAcrossResolved}
                </span>
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-emerald-50/40 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Avg correct / resolved slate
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {aggregates.averageCorrectPerResolvedSlate ?? "—"}
              </dd>
              <p className="mt-2 text-xs text-slate-500">
                Overall resolved accuracy{" "}
                {aggregates.overallResolvedAccuracyPercent !== null ?
                  `${aggregates.overallResolvedAccuracyPercent}%`
                : "—"}
              </p>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Slate timeline</h2>
          <p className="mt-2 text-sm text-slate-600">
            Newest first. Rows include every slate you have submitted picks for.
          </p>

          {history.length === 0 ?
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              No submitted slates yet. Make picks from the home page to build your history.
            </p>
          : <ul className="mt-4 divide-y divide-slate-200">
              {history.map((row) => (
                <li key={row.slateId} className="grid gap-1 py-4 first:pt-2 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Slate {row.slateStatus} · Locked {new Date(row.lockAt).toLocaleString()} · Submitted{" "}
                      {new Date(row.submittedAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Rules when scored: {row.scoringRulesetDisplayName}{" "}
                      <span className="tabular-nums">({row.scoringRulesetId})</span>
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {row.resolved ?
                        <>
                          Score {row.resolved.correct}/{row.resolved.total} correct
                        </>
                      : "Awaiting resolution"}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      Picks recorded {row.picksCount}/{row.matchupCount}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          }
        </section>

        <footer className="rounded-xl border border-slate-200 bg-white p-8 text-xs text-slate-600 shadow-md">
          <p className="text-base font-semibold text-slate-900">Fantasy scoring (MVP continuity)</p>
          <p className="mt-3 leading-relaxed text-sm text-slate-600">{defaultScoring.rulesSummary}</p>
          <p className="mt-3 leading-relaxed text-sm text-slate-500">{defaultScoring.tieBreakerLine}</p>
        </footer>
      </div>
    </PicksShell>
  );
}
