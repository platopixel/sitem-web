import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { getScoringAdapterForSlate, serializeScoringTransparency } from "@/lib/scoring";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const headerStore = await headers();
  const adminSecret = headerStore.get("x-admin-secret");
  const expectedSecret = process.env.ADMIN_PUBLISH_SECRET ?? "dev-admin";
  if (adminSecret !== expectedSecret) {
    return NextResponse.json({ error: "Admin secret is invalid." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const viewer = await resolveSession(sessionId);
  if (!viewer) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slateId = searchParams.get("slateId")?.trim();
  const emailRaw = searchParams.get("email")?.trim();
  const email = emailRaw?.toLowerCase();

  if (!slateId || !email) {
    return NextResponse.json({ error: "email and slateId query params are required." }, { status: 400 });
  }

  const store = await readStore();
  const targetUser = store.users.find((candidate) => candidate.email === email) ?? null;
  const slate = store.slates.find((candidate) => candidate.id === slateId) ?? null;

  const submission =
    targetUser ?
      store.submissions.find((sub) => sub.userId === targetUser.id && sub.slateId === slateId) ?? null
    : null;

  return NextResponse.json({
    auditedBy: viewer.email,
    submitted: submission !== null,
    user: targetUser ? { id: targetUser.id, email: targetUser.email, createdAt: targetUser.createdAt } : null,
    slate:
      slate ?
        {
          id: slate.id,
          label: slate.label,
          status: slate.status,
          lockAt: slate.lockAt,
          matchupCount: slate.matchups.length,
          scoringTransparency: serializeScoringTransparency(getScoringAdapterForSlate(slate)),
        }
      : null,
    submission:
      submission ?
        {
          updatedAt: submission.updatedAt,
          pickCount: Object.keys(submission.picks).length,
        }
      : null,
  });
}
