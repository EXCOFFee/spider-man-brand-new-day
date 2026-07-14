import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Generated at build time from the same primitives as the site: ink background,
// red accent, Anton display type. No raster is downloaded — the only bitmap in
// the project is produced here (ADR-004/005). Prerendered, so the font is read
// from source at build time (cwd is the project root).
export const prerender = true;

const font = readFileSync(resolve(process.cwd(), "src/og/anton-og.ttf"));

const INK = "#0A0A0F";
const RED = "#C8102E";
const PAPER = "#F4F1EA";
const RED_BRIGHT = "#ED2142";

type Style = Record<string, string>;
const node = (style: Style, children: unknown): { type: string; props: Record<string, unknown> } => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children },
});

export const GET: APIRoute = async () => {
  const tree = node(
    {
      width: "1200px",
      height: "630px",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px",
      backgroundColor: INK,
      color: PAPER,
      fontFamily: "Anton",
    },
    [
      node({ fontSize: "30px", letterSpacing: "10px", color: PAPER }, "ESTRENO MUNDIAL · 29.07.2026"),
      node({ flexDirection: "column" }, [
        node({ fontSize: "116px", lineHeight: "1", color: PAPER }, "SPIDER-MAN"),
        node({ fontSize: "116px", lineHeight: "1", color: RED }, "BRAND NEW DAY"),
      ]),
      node({ alignItems: "center", gap: "24px" }, [
        node({ width: "72px", height: "10px", backgroundColor: RED }, ""),
        node({ fontSize: "32px", letterSpacing: "8px", color: RED_BRIGHT }, "WEB-SLINGERS"),
      ]),
    ],
  );

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts: [{ name: "Anton", data: font, weight: 400, style: "normal" }],
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};
