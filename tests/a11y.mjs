import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

// The Vercel adapter emits the prerendered site under .vercel/output/static.
// Fall back to dist for a plain static build.
const CANDIDATE_DIRS = [".vercel/output/static", "dist/client", "dist"];
const ROOT = CANDIDATE_DIRS.find((dir) => existsSync(dir));
if (!ROOT) {
  console.error("No build output found. Run `pnpm build` first.");
  process.exit(1);
}

const ROUTES = ["/", "/en/"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".xml": "application/xml",
  ".ico": "image/x-icon",
};

async function resolveFile(urlPath) {
  let filePath = join(ROOT, decodeURIComponent(urlPath));
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    return null;
  }
  return existsSync(filePath) ? filePath : null;
}

const server = createServer(async (req, res) => {
  const filePath = await resolveFile((req.url ?? "/").split("?")[0]);
  if (!filePath) {
    res.writeHead(404).end("Not found");
    return;
  }
  const body = await readFile(filePath);
  res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
  res.end(body);
});

await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();
const base = `http://localhost:${port}`;

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
let failures = 0;

for (const route of ROUTES) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length === 0) {
    console.log(`ok   ${route} — 0 serious/critical violations`);
  } else {
    failures += serious.length;
    console.error(`FAIL ${route} — ${serious.length} serious/critical violation(s):`);
    for (const v of serious) {
      console.error(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
      console.error(`     ${v.helpUrl}`);
    }
  }
}

await browser.close();
server.close();

if (failures > 0) {
  console.error(`\n${failures} accessibility violation(s) found.`);
  process.exit(1);
}
console.log("\naxe-core: no serious or critical violations.");
