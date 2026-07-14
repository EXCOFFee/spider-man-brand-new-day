import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { KEY_PREFIX } from "./redis";

// Sliding window: 5 writes per IP per 60 seconds. This is the control that
// protects the free-tier quota under a spike (ADR-006, STRIDE / DoS).
let cached: Ratelimit | undefined;

export function getRatelimit(redis: Redis): Ratelimit {
  if (!cached) {
    cached = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: `${KEY_PREFIX}rl:slingers`,
      analytics: false,
    });
  }
  return cached;
}
