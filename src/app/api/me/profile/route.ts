import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { getProfileHistorySnapshot } from "@/lib/profile-history";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const snapshot = await getProfileHistorySnapshot(user.id);
  if (!snapshot) {
    return NextResponse.json({ error: "Profile not available." }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
