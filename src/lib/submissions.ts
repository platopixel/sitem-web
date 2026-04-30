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
