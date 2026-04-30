import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getActiveSlate } from "@/lib/slates";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const slate = await getActiveSlate();
  if (!slate) {
    return NextResponse.json({
      slate: null,
      emptyState: "No active slate is currently published.",
    });
  }

  return NextResponse.json({ slate });
}
