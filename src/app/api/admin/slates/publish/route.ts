import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { publishMockSlate } from "@/lib/slates";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";

type RequestBody = {
  label?: string;
  lockAt?: string;
};

export async function POST(request: Request) {
  const headerStore = await headers();
  const adminSecret = headerStore.get("x-admin-secret");
  const expectedSecret = process.env.ADMIN_PUBLISH_SECRET ?? "dev-admin";
  if (adminSecret !== expectedSecret) {
    return NextResponse.json({ error: "Admin secret is invalid." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const body = (await request.json()) as RequestBody;
  const label = body.label?.trim() || `Week ${new Date().getUTCDate()} Mock`;
  const lockAt = body.lockAt?.trim();
  if (!lockAt || Number.isNaN(new Date(lockAt).getTime())) {
    return NextResponse.json({ error: "A valid lockAt ISO timestamp is required." }, { status: 400 });
  }

  const slate = await publishMockSlate({ label, lockAt });
  return NextResponse.json({ ok: true, slate });
}
