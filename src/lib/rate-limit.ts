type HitWindow = {
  startedAt: number;
  count: number;
};

const windows = new Map<string, HitWindow>();

export function checkRateLimit(input: { key: string; maxHits: number; windowMs: number }) {
  const now = Date.now();
  const current = windows.get(input.key);
  if (!current || now - current.startedAt >= input.windowMs) {
    windows.set(input.key, { startedAt: now, count: 1 });
    return { allowed: true as const, remaining: input.maxHits - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= input.maxHits) {
    const retryAfterMs = input.windowMs - (now - current.startedAt);
    return {
      allowed: false as const,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  current.count += 1;
  windows.set(input.key, current);
  return {
    allowed: true as const,
    remaining: input.maxHits - current.count,
    retryAfterSeconds: 0,
  };
}
