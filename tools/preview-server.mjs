import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";

// Serves the built site for Lighthouse and answers /api/slingers the way the
// deployed function does in its degraded (no-Redis) state: GET returns the
// fallback count, POST accepts and discards. This lets the lab exercise the
// real counter flow instead of 404-ing on a missing endpoint.

const ROOT = ".vercel/output/static";
const PORT = Number(process.env.PREVIEW_PORT) || 4322;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".json": "application/json",
  ".xml": "application/xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  const path = (req.url ?? "/").split("?")[0];

  if (path === "/api/slingers") {
    if (req.method === "POST") {
      res.writeHead(202, { "content-type": "application/json", "cache-control": "no-store" });
      res.end('{"ok":false}');
    } else {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "public, s-maxage=10, stale-while-revalidate=59",
      });
      res.end('{"count":14238}');
    }
    return;
  }

  let filePath = join(ROOT, decodeURIComponent(path));
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    res.writeHead(404).end("Not found");
    return;
  }
  if (!existsSync(filePath)) {
    res.writeHead(404).end("Not found");
    return;
  }
  const ext = extname(filePath);
  const type = MIME[ext] ?? "application/octet-stream";
  let body = await readFile(filePath);

  // Match production: Vercel compresses text responses. Serving them raw here
  // would over-count transfer time in the lab.
  const COMPRESSIBLE = new Set([".html", ".css", ".js", ".svg", ".json", ".xml", ".txt"]);
  const headers = { "content-type": type };
  const accept = String(req.headers["accept-encoding"] ?? "");
  if (COMPRESSIBLE.has(ext)) {
    if (accept.includes("br")) {
      body = brotliCompressSync(body);
      headers["content-encoding"] = "br";
    } else if (accept.includes("gzip")) {
      body = gzipSync(body);
      headers["content-encoding"] = "gzip";
    }
  }
  res.writeHead(200, headers);
  res.end(body);
});

server.listen(PORT, () => console.log(`preview-server ready on ${PORT}`));
