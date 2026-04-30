import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveSession, SESSION_COOKIE } from "@/lib/auth";
import { upsertCanonicalSubmission } from "@/lib/submissions";

type RequestBody = {
  slateId?: string;
  payload?: Record<string, string>;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(sessionId);
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
  if (!slateId || !body.payload) {
    return NextResponse.json({ error: "slateId and payload are required." }, { status: 400 });
  }

  await upsertCanonicalSubmission({
    userId: user.id,
    slateId,
    payload: body.payload,
  });

  return NextResponse.json({
    ok: true,
    message: "Canonical submission stored for this user and slate.",
  });
}
