import { readStore, type SlateStatus } from "./store";

export type ProfileHistoryRow = {
  slateId: string;
  label: string;
  slateStatus: SlateStatus;
  lockAt: string;
  slatePublishedAt: string;
  submittedAt: string;
  matchupCount: number;
  picksCount: number;
  resolved: {
    correct: number;
    total: number;
    resolvedAt: string;
  } | null;
};

export type ProfileHistoryAggregates = {
  slatesEntered: number;
  slatesResolved: number;
  totalCorrectAcrossResolved: number;
  totalPickSlotsAcrossResolved: number;
  averageCorrectPerResolvedSlate: number | null;
  overallResolvedAccuracyPercent: number | null;
};

export type ProfileHistorySnapshot = {
  email: string;
  memberSince: string;
  aggregates: ProfileHistoryAggregates;
  history: ProfileHistoryRow[];
};

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export async function getProfileHistorySnapshot(userId: string): Promise<ProfileHistorySnapshot | null> {
  const store = await readStore();
  const user = store.users.find((entry) => entry.id === userId);
  if (!user) return null;

  const slateById = new Map(store.slates.map((slate) => [slate.id, slate]));

  const history: ProfileHistoryRow[] = store.submissions
    .filter((sub) => sub.userId === userId)
    .map((sub) => {
      const slate = slateById.get(sub.slateId);
      if (!slate) return null;

      const resolved = store.resolvedSubmissions.find(
        (entry) => entry.userId === userId && entry.slateId === sub.slateId,
      );

      const row: ProfileHistoryRow = {
        slateId: slate.id,
        label: slate.label,
        slateStatus: slate.status,
        lockAt: slate.lockAt,
        slatePublishedAt: slate.publishedAt ?? slate.createdAt,
        submittedAt: sub.updatedAt,
        matchupCount: slate.matchups.length,
        picksCount: Object.keys(sub.picks).length,
        resolved: resolved
          ? {
              correct: resolved.correct,
              total: resolved.total,
              resolvedAt: resolved.resolvedAt,
            }
          : null,
      };
      return row;
    })
    .filter((row): row is ProfileHistoryRow => row !== null)
    .sort(
      (a, b) =>
        new Date(b.slatePublishedAt).getTime() - new Date(a.slatePublishedAt).getTime(),
    );

  let totalCorrectAcrossResolved = 0;
  let totalPickSlotsAcrossResolved = 0;
  let slatesResolved = 0;
  for (const row of history) {
    if (!row.resolved) continue;
    slatesResolved += 1;
    totalCorrectAcrossResolved += row.resolved.correct;
    totalPickSlotsAcrossResolved += row.resolved.total;
  }

  const averageCorrectPerResolvedSlate =
    slatesResolved > 0 ? roundOneDecimal(totalCorrectAcrossResolved / slatesResolved) : null;

  const overallResolvedAccuracyPercent =
    totalPickSlotsAcrossResolved > 0
      ? roundOneDecimal((100 * totalCorrectAcrossResolved) / totalPickSlotsAcrossResolved)
      : null;

  return {
    email: user.email,
    memberSince: user.createdAt,
    aggregates: {
      slatesEntered: history.length,
      slatesResolved,
      totalCorrectAcrossResolved,
      totalPickSlotsAcrossResolved,
      averageCorrectPerResolvedSlate,
      overallResolvedAccuracyPercent,
    },
    history,
  };
}
