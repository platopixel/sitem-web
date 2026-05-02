import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <main className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">Profile & history</p>
            <h1 className="text-2xl font-semibold text-slate-900">{snapshot.email}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Member since {new Date(memberSince).toLocaleDateString()}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Back to picks
          </Link>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">Aggregate performance</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Slates with submitted picks
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{aggregates.slatesEntered}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Resolved slates scored
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{aggregates.slatesResolved}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
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

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900">Slate timeline</h2>
          <p className="mt-2 text-sm text-slate-600">
            Newest first. Rows include every slate you have submitted picks for.
          </p>

          {history.length === 0 ?
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 text-sm text-slate-700">
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

        <footer className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600 shadow-md">
          <p className="font-semibold text-slate-900">Fantasy scoring (MVP continuity)</p>
          <p className="mt-2 leading-relaxed">{defaultScoring.rulesSummary}</p>
          <p className="mt-2 leading-relaxed text-slate-500">{defaultScoring.tieBreakerLine}</p>
        </footer>
      </main>
    </div>
  );
}
