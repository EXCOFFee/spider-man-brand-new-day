import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";

// Scans the client-facing build output for any trace of the Upstash
// credentials. The redis client is imported only from server-only modules
// (the /api/slingers function), so nothing here should ever appear in the
// bundle the browser downloads. If it does, the build must fail: a leaked
// token is a security incident, not a warning.

const CANDIDATE_DIRS = [".vercel/output/static", "dist/client", "dist"];
const ROOTS = CANDIDATE_DIRS.filter((dir) => existsSync(dir));
if (ROOTS.length === 0) {
  console.error("No build output found. Run `pnpm build` first.");
  process.exit(1);
}

const SCANNED_EXTENSIONS = new Set([".js", ".mjs", ".css", ".html", ".json", ".map", ".txt"]);

// Static markers that must never reach the client, plus the live secret values
// when they are present in the environment (as they are in CI).
const forbidden = [
  { label: "Upstash host", pattern: /[a-z0-9-]+\.upstash\.io/i },
  { label: "Upstash REST token env name", pattern: /UPSTASH_REDIS_REST_TOKEN\s*[:=]/ },
];
for (const name of ["UPSTASH_REDIS_REST_TOKEN", "UPSTASH_REDIS_REST_URL"]) {
  const value = process.env[name];
  if (value && value.length >= 8) {
    forbidden.push({ label: `value of ${name}`, pattern: value });
  }
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (SCANNED_EXTENSIONS.has(extname(entry.name))) files.push(full);
  }
  return files;
}

const files = (await Promise.all(ROOTS.map(walk))).flat();

// A zero-file scan means the client bundle is missing or the build is
// incomplete: fail rather than pass vacuously.
if (files.length === 0) {
  console.error(`No client files found in ${ROOTS.join(", ")}. The build looks incomplete.`);
  process.exit(1);
}

let leaks = 0;
for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const { label, pattern } of forbidden) {
    const found = typeof pattern === "string" ? content.includes(pattern) : pattern.test(content);
    if (found) {
      leaks += 1;
      console.error(`LEAK ${file} contains ${label}`);
    }
  }
}

if (leaks > 0) {
  console.error(`\n${leaks} secret leak(s) found. Failing the build.`);
  process.exit(1);
}
console.log(`check:secrets — scanned ${files.length} file(s) in ${ROOTS.join(", ")}, no secrets found.`);
