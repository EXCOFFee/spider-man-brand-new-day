import { Redis } from "@upstash/redis";

// Every key this project writes is namespaced, so the same Upstash database can
// be shared with other apps without collisions.
export const KEY_PREFIX = "smbnd:";

// The counter key. A single key of cardinality 1 — the intentional hot
// partition the whole design is built to absorb (ADR-006).
export const COUNTER_KEY = `${KEY_PREFIX}counter:global`;

// Read credentials at runtime (Vercel injects them into the function env). If
// they are absent, the client is null and every caller degrades gracefully —
// the page must never learn that Redis exists.
let cached: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}

/**
 * Races a Redis call against a hard deadline. A frozen number beats a user
 * waiting, so on timeout we reject and the caller falls back.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("redis-timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const REDIS_TIMEOUT_MS = 1000;
