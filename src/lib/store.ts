import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type StoredSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type StoredSubmission = {
  userId: string;
  slateId: string;
  picks: Record<string, "A" | "B">;
  updatedAt: string;
};

export type SlateStatus = "draft" | "open" | "locked" | "resolved";

export type StoredMatchup = {
  id: string;
  playerA: string;
  playerB: string;
  projectedA: number;
  projectedB: number;
};

export type StoredSlate = {
  id: string;
  label: string;
  lockAt: string;
  status: SlateStatus;
  matchups: StoredMatchup[];
  createdAt: string;
  publishedAt?: string;
};

type StoreShape = {
  users: StoredUser[];
  sessions: StoredSession[];
  submissions: StoredSubmission[];
  slates: StoredSlate[];
};

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "mvp-store.json");

const DEFAULT_STORE: StoreShape = {
  users: [],
  sessions: [],
  submissions: [],
  slates: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore() {
  await mkdir(STORE_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

export async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<StoreShape>;
  const submissions = (parsed.submissions ?? []).map((entry) => {
    const picksSource =
      "picks" in entry && typeof entry.picks === "object" && entry.picks
        ? entry.picks
        : "payload" in entry && typeof entry.payload === "object" && entry.payload
          ? entry.payload
          : {};
    const picks: Record<string, "A" | "B"> = {};
    for (const [matchupId, side] of Object.entries(picksSource)) {
      if (side === "A" || side === "B") {
        picks[matchupId] = side;
      }
    }
    return {
      userId: typeof entry.userId === "string" ? entry.userId : "",
      slateId: typeof entry.slateId === "string" ? entry.slateId : "",
      picks,
      updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date(0).toISOString(),
    };
  });
  return {
    users: parsed.users ?? [],
    sessions: parsed.sessions ?? [],
    submissions,
    slates: parsed.slates ?? [],
  };
}

export async function updateStore(
  mutator: (current: StoreShape) => StoreShape,
): Promise<StoreShape> {
  writeQueue = writeQueue.then(async () => {
    const current = await readStore();
    const next = mutator(current);
    await writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  });

  await writeQueue;
  return readStore();
}
