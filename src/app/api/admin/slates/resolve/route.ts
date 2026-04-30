import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { resolveSlateFromAnswerKey } from "@/lib/results";

type ResolveBody = {
  slateId?: string;
  forceLockNow?: boolean;
  answerKey?: Array<{
    matchupId: string;
    actualA?: number;
    actualB?: number;
    policy?: "normal" | "postponed";
  }>;
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

  const body = (await request.json()) as ResolveBody;
  const slateId = body.slateId?.trim();
  if (!slateId || !body.answerKey?.length) {
    return NextResponse.json({ error: "slateId and answerKey are required." }, { status: 400 });
  }

  try {
    const result = await resolveSlateFromAnswerKey({
      slateId,
      answerKey: body.answerKey,
      forceLockNow: body.forceLockNow,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve slate.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
