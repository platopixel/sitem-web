import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { updateStore, type StoredSession, type StoredUser } from "./store";

export const SESSION_COOKIE = "ccfp_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function makeId(prefix: string) {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, expectedHash] = passwordHash.split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  if (actualHash.byteLength !== expected.byteLength) return false;
  return timingSafeEqual(actualHash, expected);
}

export async function createUser(email: string, password: string): Promise<StoredUser> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date().toISOString();
  const id = makeId("usr");
  const user: StoredUser = {
    id,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: now,
  };

  await updateStore((current) => {
    if (current.users.some((existing) => existing.email === normalizedEmail)) {
      throw new Error("EMAIL_EXISTS");
    }

    return {
      ...current,
      users: [...current.users, user],
    };
  });

  return user;
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const nextState = await updateStore((current) => current);
  const user = nextState.users.find((candidate) => candidate.email === normalizedEmail);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function createSession(userId: string): Promise<StoredSession> {
  const nowMs = Date.now();
  const session: StoredSession = {
    id: makeId("ses"),
    userId,
    createdAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + SESSION_TTL_MS).toISOString(),
  };

  await updateStore((current) => ({
    ...current,
    sessions: [...current.sessions.filter((entry) => entry.userId !== userId), session],
  }));

  return session;
}

export async function resolveSession(sessionId: string | undefined): Promise<StoredUser | null> {
  if (!sessionId) return null;
  const now = Date.now();

  let resolvedUser: StoredUser | null = null;
  await updateStore((current) => {
    const activeSessions = current.sessions.filter(
      (candidate) => new Date(candidate.expiresAt).getTime() > now,
    );

    const match = activeSessions.find((candidate) => candidate.id === sessionId);
    resolvedUser = match
      ? current.users.find((candidate) => candidate.id === match.userId) ?? null
      : null;

    return {
      ...current,
      sessions: activeSessions,
    };
  });

  return resolvedUser;
}

export async function deleteSession(sessionId: string | undefined) {
  if (!sessionId) return;
  await updateStore((current) => ({
    ...current,
    sessions: current.sessions.filter((candidate) => candidate.id !== sessionId),
  }));
}
