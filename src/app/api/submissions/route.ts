import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { arePicksEqual, getSubmissionForUserSlate, upsertCanonicalSubmission } from "@/lib/submissions";
import { getSlateById } from "@/lib/slates";
import { checkRateLimit } from "@/lib/rate-limit";
import { getInactivePlayerPolicyPayload } from "@/lib/inactive-player-policy";
import { getResolvedSubmissionForUser } from "@/lib/results";

type RequestBody = {
  slateId?: string;
  picks?: Record<string, string>;
};

async function resolveAuthedUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
  if (!user) {
    return null;
  }
  return user;
}

export async function GET(request: Request) {
  const user = await resolveAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slateId = searchParams.get("slateId")?.trim();
  if (!slateId) {
    return NextResponse.json({ error: "slateId is required." }, { status: 400 });
  }

  const submission = await getSubmissionForUserSlate({ userId: user.id, slateId });
  const resolved = await getResolvedSubmissionForUser({ userId: user.id, slateId });
  return NextResponse.json({
    inactiveParticipantPolicy: getInactivePlayerPolicyPayload(),
    submission: submission
      ? {
          slateId: submission.slateId,
          picks: submission.picks,
          updatedAt: submission.updatedAt,
        }
      : null,
    resolved,
  });
}

export async function POST(request: Request) {
  const user = await resolveAuthedUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "Session expired. Please sign in again.",
        reauthPath: "/?reauth=1",
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as RequestBody;
  const slateId = body.slateId?.trim();
  if (!slateId || !body.picks) {
    return NextResponse.json({ error: "slateId and picks are required." }, { status: 400 });
  }

  const slate = await getSlateById(slateId);
  if (!slate || slate.status !== "open") {
    return NextResponse.json({ error: "This slate is not currently open for picks." }, { status: 400 });
  }

  const requiredMatchups = new Set(slate.matchups.map((matchup) => matchup.id));
  const submittedMatchups = Object.keys(body.picks);
  for (const matchupId of submittedMatchups) {
    if (!requiredMatchups.has(matchupId)) {
      return NextResponse.json({ error: `Unknown matchup "${matchupId}".` }, { status: 400 });
    }
    const side = body.picks[matchupId];
    if (side !== "A" && side !== "B") {
      return NextResponse.json(
        { error: `Invalid pick value for "${matchupId}". Use "A" or "B".` },
        { status: 400 },
      );
    }
  }
  if (submittedMatchups.length !== slate.matchups.length) {
    return NextResponse.json({ error: "Please make a pick for all matchups before submitting." }, { status: 400 });
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-ip";
  const limit = checkRateLimit({
    key: `${user.id}:${forwardedFor}:submit-picks`,
    maxHits: 10,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submit attempts. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const nextPicks = body.picks as Record<string, "A" | "B">;
  const existing = await getSubmissionForUserSlate({ userId: user.id, slateId });
  if (existing && arePicksEqual(existing.picks, nextPicks)) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      message: "Picks already submitted. No changes were needed.",
      inactiveParticipantPolicy: getInactivePlayerPolicyPayload(),
    });
  }

  await upsertCanonicalSubmission({
    userId: user.id,
    slateId,
    picks: nextPicks,
  });

  return NextResponse.json({
    ok: true,
    message: "Picks submitted successfully.",
    inactiveParticipantPolicy: getInactivePlayerPolicyPayload(),
  });
}
