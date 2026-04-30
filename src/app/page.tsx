import { cookies } from "next/headers";
import { AuthPanel } from "./auth-panel";
import { SessionTools } from "./session-tools";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <main className="w-full max-w-3xl space-y-6">
        {user ? (
          <>
            <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/20 dark:bg-black">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Signed in as</p>
              <h1 className="text-2xl font-semibold">{user.email}</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Phase 3 status: active slate picks flow is enabled for signed-in users.
              </p>
            </section>
            <SessionTools />
          </>
        ) : (
          <AuthPanel />
        )}
      </main>
    </div>
  );
}
