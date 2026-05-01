import { randomBytes } from "node:crypto";
import { DEFAULT_SCORING_RULESET_ID } from "@/lib/scoring";
import { readStore, type StoredMatchup, type StoredSlate, updateStore } from "./store";

function makeId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

function buildMockMatchups(): StoredMatchup[] {
  const pairs: [string, string, number, number][] = [
    ["Amon-Ra St. Brown", "CeeDee Lamb", 19.4, 19.1],
    ["Breece Hall", "Travis Etienne", 15.7, 15.4],
    ["Drake London", "Jaylen Waddle", 14.6, 14.4],
    ["Sam LaPorta", "George Kittle", 12.3, 12.1],
    ["Jordan Love", "Trevor Lawrence", 18.2, 18.0],
    ["Isiah Pacheco", "Rachaad White", 13.7, 13.4],
    ["Chris Olave", "DK Metcalf", 14.1, 13.9],
    ["DeVonta Smith", "Nico Collins", 13.5, 13.3],
    ["Tee Higgins", "Calvin Ridley", 12.8, 12.6],
    ["Kyler Murray", "Jared Goff", 17.9, 17.7],
  ];

  return pairs.map(([playerA, playerB, projectedA, projectedB], index) => {
    const base: StoredMatchup = {
      id: `m${index + 1}`,
      playerA,
      playerB,
      projectedA,
      projectedB,
    };
    // Phase 9 demo: one expected pre-lock inactive (Player B) — policy still allows picking either side.
    if (index === 1) {
      return { ...base, preLockParticipationB: "inactive" as const };
    }
    return base;
  });
}

export async function publishMockSlate(input: { label: string; lockAt: string }) {
  const now = new Date().toISOString();
  const slate: StoredSlate = {
    id: makeId("slate"),
    label: input.label,
    lockAt: input.lockAt,
    status: "open",
    scoringRulesetId: DEFAULT_SCORING_RULESET_ID,
    matchups: buildMockMatchups(),
    createdAt: now,
    publishedAt: now,
  };

  await updateStore((current) => {
    const slates = current.slates.map((existing) => {
      if (existing.status === "open") {
        return { ...existing, status: "locked" as const };
      }
      return existing;
    });

    return {
      ...current,
      slates: [...slates, slate],
    };
  });

  return slate;
}

export async function getActiveSlate() {
  const store = await updateStore((current) => {
    const now = Date.now();
    const nextSlates = current.slates.map((slate) => {
      if (slate.status === "open" && new Date(slate.lockAt).getTime() <= now) {
        return { ...slate, status: "locked" as const };
      }
      return slate;
    });
    return { ...current, slates: nextSlates };
  });

  return store.slates
    .filter((slate) => slate.status === "open")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

export async function getLatestPlayableSlate() {
  const store = await updateStore((current) => {
    const now = Date.now();
    const nextSlates = current.slates.map((slate) => {
      if (slate.status === "open" && new Date(slate.lockAt).getTime() <= now) {
        return { ...slate, status: "locked" as const };
      }
      return slate;
    });
    return { ...current, slates: nextSlates };
  });

  const sorted = [...store.slates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const openSlate = sorted.find((slate) => slate.status === "open");
  if (openSlate) return openSlate;
  return sorted.find((slate) => slate.status === "locked" || slate.status === "resolved") ?? null;
}

export async function getSlateById(slateId: string) {
  await updateStore((current) => {
    const now = Date.now();
    const nextSlates = current.slates.map((slate) => {
      if (slate.status === "open" && new Date(slate.lockAt).getTime() <= now) {
        return { ...slate, status: "locked" as const };
      }
      return slate;
    });
    return { ...current, slates: nextSlates };
  });
  const store = await readStore();
  return store.slates.find((slate) => slate.id === slateId) ?? null;
}
