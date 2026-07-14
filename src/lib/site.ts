// Shared, language-agnostic constants.

/** Release target for the countdown, in UTC. The delta is always computed from
 *  this fixed instant, never from the visitor's clock. */
export const TARGET_DATE = "2026-07-29T00:00:00Z";

/** Counter value inlined into the HTML at build time. It is what renders when
 *  JavaScript is disabled or Redis is unreachable, so the number is never blank. */
export const SLINGERS_FALLBACK = Math.max(
  0,
  Math.trunc(Number(import.meta.env.PUBLIC_SLINGERS_FALLBACK ?? 14238)) || 14238,
);

/** Public repository URL. Finalized at deploy. */
export const REPO_URL = "https://github.com/EXCOFFee/spider-man-brand-new-day";

export const SITE_URL = "https://spider-man-brand-new-day.vercel.app";
