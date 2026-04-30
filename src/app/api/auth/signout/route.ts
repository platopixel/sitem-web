import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  await deleteSession(sessionId);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
