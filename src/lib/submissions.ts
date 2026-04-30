import { updateStore } from "./store";

export async function upsertCanonicalSubmission(input: {
  userId: string;
  slateId: string;
  payload: Record<string, string>;
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
            payload: input.payload,
            updatedAt: now,
          },
        ],
      };
    }

    const nextSubmissions = [...current.submissions];
    nextSubmissions[existingIndex] = {
      ...nextSubmissions[existingIndex],
      payload: input.payload,
      updatedAt: now,
    };

    return {
      ...current,
      submissions: nextSubmissions,
    };
  });
}
