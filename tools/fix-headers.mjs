import { readFileSync, writeFileSync, existsSync } from "node:fs";

// The Vercel adapter emits the immutable-asset header route AFTER the
// `handle: filesystem` marker, so it never applies: static files are served by
// filesystem first, with Vercel's default `max-age=0, must-revalidate`. Header
// routes must run BEFORE filesystem (with `continue: true`) to attach to the
// file response. This moves them there and covers the self-hosted font too.
//
// Runs as part of `build`, so it corrects the output on every platform,
// including Vercel's own build.

const CONFIG = ".vercel/output/config.json";

if (!existsSync(CONFIG)) {
  console.log("fix-headers: no adapter config found, skipping");
  process.exit(0);
}

const IMMUTABLE = "public, max-age=31536000, immutable";
const assetRoutes = [
  { src: "^/_astro/(.*)$", headers: { "cache-control": IMMUTABLE }, continue: true },
  { src: "^/fonts/(.*)$", headers: { "cache-control": IMMUTABLE }, continue: true },
];

const config = JSON.parse(readFileSync(CONFIG, "utf8"));
const routes = config.routes ?? [];

const isAssetHeaderRoute = (route) =>
  typeof route.src === "string" &&
  (route.src.includes("/_astro/") || route.src.includes("/fonts/")) &&
  route.headers?.["cache-control"];

// Drop the adapter's mis-placed header routes, then prepend ours before
// everything else (i.e. before `handle: filesystem`).
config.routes = [...assetRoutes, ...routes.filter((route) => !isAssetHeaderRoute(route))];

writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`);
console.log("fix-headers: immutable asset headers moved before filesystem");
