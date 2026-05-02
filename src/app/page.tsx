import Link from "next/link";
import { cookies } from "next/headers";
import { PicksShell } from "@/components/picks-shell";
import { AuthPanel } from "./auth-panel";
import { SessionTools } from "./session-tools";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);

  return (
    <PicksShell>
      <div className="space-y-6">
        {user ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
              <p className="text-sm font-medium text-slate-600">Signed in as</p>
              <h2 className="text-2xl font-semibold text-slate-900">{user.email}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Active slate picks are available for your account.
              </p>
              <p className="mt-3">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-emerald-600 underline decoration-emerald-600/30 underline-offset-4 hover:text-emerald-700"
                >
                  Profile & history
                </Link>
              </p>
            </section>
            <SessionTools />
          </>
        ) : (
          <AuthPanel />
        )}
      </div>
    </PicksShell>
  );
}
