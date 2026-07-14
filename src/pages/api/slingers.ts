import type { APIRoute } from "astro";
import { getRedis, withTimeout, COUNTER_KEY, REDIS_TIMEOUT_MS } from "../../lib/redis";
import { getRatelimit } from "../../lib/ratelimit";
import { SLINGERS_FALLBACK } from "../../lib/site";

export const prerender = false;

const COOKIE = "slinger";
const DEDUP_TTL = 86_400; // 24 h idempotency window
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number, cache: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

// GET: read the counter, cached hard at the edge. Any Redis failure returns the
// fallback with a 200 — never a 5xx. The page can never tell Redis is down.
export const GET: APIRoute = async () => {
  const redis = getRedis();
  let count = SLINGERS_FALLBACK;
  if (redis) {
    try {
      const value = await withTimeout(redis.get<number>(COUNTER_KEY), REDIS_TIMEOUT_MS);
      if (typeof value === "number" && Number.isFinite(value)) count = value;
    } catch {
      // Timeout or transport error: keep the fallback.
    }
  }
  return json({ count }, 200, "public, s-maxage=10, stale-while-revalidate=59");
};

// POST: count this visitor at most once. Rate limit first, then idempotency by
// cookie, then a single atomic INCR. The endpoint accepts no payload, so the
// increment is a server constant that a client cannot inflate.
export const POST: APIRoute = async ({ cookies, clientAddress }) => {
  const redis = getRedis();
  // No Redis: accept and discard. A lost +1 on a fan counter is documented loss.
  if (!redis) return json({ ok: false }, 202, "no-store");

  // 1. Rate limit by IP. Exceeded -> 429 without touching the counter.
  let ip = "0.0.0.0";
  try {
    ip = clientAddress || ip;
  } catch {
    // Some runtimes throw when clientAddress is unavailable; the default is fine.
  }
  try {
    const { success } = await withTimeout(getRatelimit(redis).limit(ip), REDIS_TIMEOUT_MS);
    if (!success) return json({ ok: false, error: "rate_limited" }, 429, "no-store");
  } catch {
    return json({ ok: false }, 202, "no-store");
  }

  // 2. Idempotency: one INCR per cookie.
  let uuid = cookies.get(COOKIE)?.value;
  if (!uuid || !UUID_RE.test(uuid)) {
    uuid = crypto.randomUUID();
    cookies.set(COOKIE, uuid, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: DEDUP_TTL,
    });
  }

  try {
    // SET NX wins only if this cookie has not been counted in the last 24 h.
    const won = await withTimeout(
      redis.set(`${COOKIE}:${uuid}`, 1, { nx: true, ex: DEDUP_TTL }),
      REDIS_TIMEOUT_MS,
    );
    if (won === null) {
      // Already counted -> no-op. No body on a 204.
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }
    // 3. The only place the counter changes: one atomic INCR. Never GET + SET.
    const count = await withTimeout(redis.incr(COUNTER_KEY), REDIS_TIMEOUT_MS);
    return json({ ok: true, counted: true, count }, 200, "no-store");
  } catch {
    // Redis failed mid-write: accept and discard, never a 5xx.
    return json({ ok: false }, 202, "no-store");
  }
};
