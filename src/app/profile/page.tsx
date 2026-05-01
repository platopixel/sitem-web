import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
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

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-zinc-50 p-6 dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Profile & history</p>
            <h1 className="text-2xl font-semibold">{snapshot.email}</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Member since {new Date(memberSince).toLocaleDateString()}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Back to picks
          </Link>
        </div>

        <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/20 dark:bg-black">
          <h2 className="text-lg font-semibold">Aggregate performance</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-black/10 p-3 dark:border-white/20">
              <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Slates with submitted picks
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{aggregates.slatesEntered}</dd>
            </div>
            <div className="rounded-md border border-black/10 p-3 dark:border-white/20">
              <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Resolved slates scored
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{aggregates.slatesResolved}</dd>
            </div>
            <div className="rounded-md border border-black/10 p-3 dark:border-white/20">
              <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Correct picks (resolved totals)
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {aggregates.totalCorrectAcrossResolved}
                <span className="text-lg font-normal text-zinc-500 dark:text-zinc-400">
                  {" "}
                  / {aggregates.totalPickSlotsAcrossResolved}
                </span>
              </dd>
            </div>
            <div className="rounded-md border border-black/10 p-3 dark:border-white/20">
              <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Avg correct / resolved slate
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {aggregates.averageCorrectPerResolvedSlate ?? "—"}
              </dd>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Overall resolved accuracy{" "}
                {aggregates.overallResolvedAccuracyPercent !== null ?
                  `${aggregates.overallResolvedAccuracyPercent}%`
                : "—"}
              </p>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/20 dark:bg-black">
          <h2 className="text-lg font-semibold">Slate timeline</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Newest first. Rows include every slate you have submitted picks for.
          </p>

          {history.length === 0 ?
            <p className="mt-4 rounded-md border border-dashed border-black/15 p-4 text-sm dark:border-white/25">
              No submitted slates yet. Make picks from the home page to build your history.
            </p>
          : <ul className="mt-4 divide-y divide-black/10 dark:divide-white/15">
              {history.map((row) => (
                <li key={row.slateId} className="grid gap-1 py-4 first:pt-2 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Slate {row.slateStatus} · Locked {new Date(row.lockAt).toLocaleString()} · Submitted{" "}
                      {new Date(row.submittedAt).toLocaleString()}
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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      Picks recorded {row.picksCount}/{row.matchupCount}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          }
        </section>
      </main>
    </div>
  );
}
