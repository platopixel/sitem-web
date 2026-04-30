import { updateStore } from "./store";

export async function upsertCanonicalSubmission(input: {
  userId: string;
  slateId: string;
  picks: Record<string, "A" | "B">;
}) {
  const now = new Date().toISOString();

  await updateStore((current) => {
    const existingIndex = current.submissions.findIndex(
      (entry) => entry.userId === input.userId && entry.slateId === input.slateId,
    );

    if (existingIndex === -1) {
      return {
        ...current,
        submissions: [
          ...current.submissions,
          {
            userId: input.userId,
            slateId: input.slateId,
            picks: input.picks,
            updatedAt: now,
          },
        ],
      };
    }

    const nextSubmissions = [...current.submissions];
    nextSubmissions[existingIndex] = {
      ...nextSubmissions[existingIndex],
      picks: input.picks,
      updatedAt: now,
    };

    return {
      ...current,
      submissions: nextSubmissions,
    };
  });
}

export async function getSubmissionForUserSlate(input: { userId: string; slateId: string }) {
  const store = await updateStore((current) => current);
  return (
    store.submissions.find(
      (entry) => entry.userId === input.userId && entry.slateId === input.slateId,
    ) ?? null
  );
}

export function arePicksEqual(
  left: Record<string, "A" | "B">,
  right: Record<string, "A" | "B">,
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}
