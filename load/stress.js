import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Load test for the traffic spike. Ramps to 1000 concurrent VUs over 5 minutes.
// The thesis this proves: reads collapse onto the edge cache, so Redis sees a
// tiny, near-constant fan-out regardless of incoming traffic.
//
//   BASE_URL=https://your-deployment.vercel.app pnpm load
//
// Verify against the Upstash console afterwards: the command count there is the
// number that proves the fan-out, not anything k6 can measure on its own.

const BASE = __ENV.BASE_URL || "https://spider-man-brand-new-day-two.vercel.app";

// Peak concurrency and the POST share are overridable so the same script runs
// as a smoke test or as the full 1000-VU spike. Defaults are the spike.
const PEAK = Number(__ENV.PEAK_VUS) || 1000;
const STAGE = __ENV.STAGE_DUR || "1m";
const POST_SHARE = __ENV.POST_SHARE !== undefined ? Number(__ENV.POST_SHARE) : 0.1;

const edgeCacheHit = new Rate("edge_cache_hit");
const apiGetLatency = new Trend("api_get_latency", true);

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: STAGE, target: Math.round(PEAK * 0.25) },
        { duration: STAGE, target: Math.round(PEAK * 0.6) },
        { duration: STAGE, target: PEAK },
        { duration: STAGE, target: PEAK },
        { duration: STAGE, target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    edge_cache_hit: ["rate>0.99"],
  },
};

export default function () {
  // The real workload is overwhelmingly reads: visitors loading the page and
  // the counter value.
  const home = http.get(`${BASE}/`);
  check(home, { "home 200": (r) => r.status === 200 });

  const api = http.get(`${BASE}/api/slingers`);
  check(api, { "api 200": (r) => r.status === 200 });
  apiGetLatency.add(api.timings.duration);
  const xCache = String(api.headers["X-Vercel-Cache"] || "").toUpperCase();
  edgeCacheHit.add(xCache === "HIT" || xCache === "STALE");

  // A minority actually increment. Browsers send an Origin header, so the CSRF
  // guard passes; the counter stays idempotent per cookie server-side.
  if (POST_SHARE > 0 && Math.random() < POST_SHARE) {
    http.post(`${BASE}/api/slingers`, null, { headers: { Origin: BASE } });
  }

  sleep(1);
}
