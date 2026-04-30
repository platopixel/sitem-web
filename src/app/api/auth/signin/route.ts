import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, verifyCredentials } from "@/lib/auth";

type RequestBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const email = body.email?.trim();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const session = await createSession(user.id);
  const response = NextResponse.json({ ok: true, email: user.email });
  response.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  return response;
}
