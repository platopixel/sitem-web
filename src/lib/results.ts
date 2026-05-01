import { type FantasyScoringAdapter, getScoringAdapterForSlate } from "@/lib/scoring";
import {
  type StoredResolvedMatchup,
  type StoredResolvedSubmission,
  updateStore,
} from "./store";
import { getSlateById } from "./slates";

type AnswerEntry = {
  matchupId: string;
  actualA?: number;
  actualB?: number;
  policy?: "normal" | "postponed";
};

function resolveMatchup(adapter: FantasyScoringAdapter, entry: AnswerEntry): StoredResolvedMatchup {
  const policy = entry.policy ?? "normal";
  if (policy === "postponed") {
    return {
      matchupId: entry.matchupId,
      winner: "void",
      actualA: null,
      actualB: null,
      policy,
    };
  }

  const actualA = entry.actualA;
  const actualB = entry.actualB;
  if (typeof actualA !== "number" || typeof actualB !== "number") {
    throw new Error(`Matchup "${entry.matchupId}" requires numeric actualA/actualB.`);
  }
  return {
    matchupId: entry.matchupId,
    winner: adapter.compareActualTotalsWinner(actualA, actualB),
    actualA,
    actualB,
    policy,
  };
}

export async function resolveSlateFromAnswerKey(input: {
  slateId: string;
  answerKey: AnswerEntry[];
  forceLockNow?: boolean;
}) {
  const slate = await getSlateById(input.slateId);
  if (!slate) {
    throw new Error("Slate not found.");
  }
  if (slate.status === "open" && !input.forceLockNow) {
    throw new Error("Slate must be locked before resolving.");
  }

  const required = new Set(slate.matchups.map((m) => m.id));
  const byId = new Map(input.answerKey.map((entry) => [entry.matchupId, entry]));
  for (const id of required) {
    if (!byId.has(id)) {
      throw new Error(`Answer key missing matchup "${id}".`);
    }
  }

  const scoringAdapter = getScoringAdapterForSlate(slate);
  const resolvedMatchups = slate.matchups.map((m) => resolveMatchup(scoringAdapter, byId.get(m.id)!));
  const now = new Date().toISOString();

  const store = await updateStore((current) => {
    const relevantSubmissions = current.submissions.filter((s) => s.slateId === slate.id);
    const nextResolvedForSlate: StoredResolvedSubmission[] = relevantSubmissions.map((submission) => {
      let correct = 0;
      const matchups = resolvedMatchups.map((resolved) => {
        const userPick = submission.picks[resolved.matchupId] ?? null;
        const isCorrect =
          resolved.winner === "void" || userPick === null ? null : Boolean(userPick === resolved.winner);
        if (isCorrect) correct += 1;
        return { ...resolved, userPick, isCorrect };
      });
      return {
        userId: submission.userId,
        slateId: submission.slateId,
        correct,
        total: resolvedMatchups.length,
        matchups,
        resolvedAt: now,
      };
    });

    const nextResolvedSubmissions = current.resolvedSubmissions.filter((r) => r.slateId !== slate.id);
    const nextSlates = current.slates.map((existing) =>
      existing.id === slate.id ? { ...existing, status: "resolved" as const } : existing,
    );
    return {
      ...current,
      slates: nextSlates,
      resolvedSubmissions: [...nextResolvedSubmissions, ...nextResolvedForSlate],
    };
  });

  return {
    slateId: slate.id,
    resolvedMatchups,
    resolvedSubmissionCount: store.resolvedSubmissions.filter((r) => r.slateId === slate.id).length,
  };
}

export async function getResolvedSubmissionForUser(input: { userId: string; slateId: string }) {
  const store = await updateStore((current) => current);
  return (
    store.resolvedSubmissions.find(
      (resolved) => resolved.userId === input.userId && resolved.slateId === input.slateId,
    ) ?? null
  );
}
