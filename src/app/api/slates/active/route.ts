import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { getLatestPlayableSlate } from "@/lib/slates";
import { getInactivePlayerPolicyPayload } from "@/lib/inactive-player-policy";
import { getScoringAdapterForSlate, serializeScoringTransparency } from "@/lib/scoring";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const slate = await getLatestPlayableSlate();
  if (!slate) {
    return NextResponse.json({
      slate: null,
      scoringTransparency: null,
      inactiveParticipantPolicy: getInactivePlayerPolicyPayload(),
      emptyState: "No active slate is currently published.",
    });
  }

  const scoringAdapter = getScoringAdapterForSlate(slate);

  return NextResponse.json({
    slate,
    readOnly: slate.status !== "open",
    scoringTransparency: serializeScoringTransparency(scoringAdapter),
    scoringRulesetId: slate.scoringRulesetId ?? scoringAdapter.id,
    inactiveParticipantPolicy: getInactivePlayerPolicyPayload(),
  });
}
