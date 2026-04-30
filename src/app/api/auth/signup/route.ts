import { NextResponse } from "next/server";
import { createSession, createUser, SESSION_COOKIE } from "@/lib/auth";

type RequestBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const email = body.email?.trim();
  const password = body.password?.trim();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Provide an email and password (8+ chars)." },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(email, password);
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
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
