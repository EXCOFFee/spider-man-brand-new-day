// Parametric spider web, computed at build time and emitted as inline SVG.
// A real web hangs and is never mechanically regular, so cross-threads are
// concave Bezier curves with a touch of gravity, and every node carries a small
// deterministic jitter. The PRNG is seeded so the geometry — and therefore the
// asset hash — is stable across builds.

export interface WebParams {
  /** Number of radial threads fanning out from the anchor. */
  radials: number;
  /** Number of concentric layers of cross-threads. */
  rings: number;
  /** Angular span of the fan, in degrees. */
  spanStart: number;
  spanEnd: number;
  /** Radius of the outermost ring, in viewBox units. */
  maxRadius: number;
  /** Radius of the innermost ring, in viewBox units. */
  minRadius: number;
  /** Concavity of cross-threads toward the anchor (0..1 of segment length). */
  curve: number;
  /** Downward sag of cross-threads (0..1 of segment length). */
  gravity: number;
  /** Positional jitter as a fraction of ring spacing. */
  jitter: number;
  /** Anchor point in viewBox units. */
  anchor: { x: number; y: number };
  seed: number;
}

export interface WebGeometry {
  radials: string[];
  threads: string[];
  nodes: { x: number; y: number }[];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (v: number): number => Math.round(v * 100) / 100;

export function buildWeb(params: WebParams): WebGeometry {
  const {
    radials,
    rings,
    spanStart,
    spanEnd,
    maxRadius,
    minRadius,
    curve,
    gravity,
    jitter,
    anchor,
    seed,
  } = params;

  const rand = mulberry32(seed);
  const between = (lo: number, hi: number): number => lo + rand() * (hi - lo);
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const angles = Array.from({ length: radials }, (_, i) => {
    const t = radials === 1 ? 0.5 : i / (radials - 1);
    return toRad(spanStart + t * (spanEnd - spanStart));
  });

  // Ring radii grow slightly faster outward (capture spiral loosens with distance).
  const ringSpacing = (maxRadius - minRadius) / (rings - 1);
  const ringRadii = Array.from({ length: rings }, (_, j) => {
    const base = minRadius + j * ringSpacing;
    return base + (j === 0 ? 0 : between(-jitter, jitter) * ringSpacing);
  });

  // Node grid: one point per (radial, ring) with per-node radius jitter.
  const grid: { x: number; y: number }[][] = angles.map((angle) =>
    ringRadii.map((r) => {
      const rr = r + between(-jitter, jitter) * ringSpacing;
      return { x: anchor.x + Math.cos(angle) * rr, y: anchor.y + Math.sin(angle) * rr };
    }),
  );

  const nodes: { x: number; y: number }[] = [];
  const radialPaths: string[] = [];
  for (let i = 0; i < angles.length; i++) {
    const col = grid[i]!;
    const last = col[col.length - 1]!;
    radialPaths.push(`M${n(anchor.x)} ${n(anchor.y)}L${n(last.x)} ${n(last.y)}`);
    for (const node of col) nodes.push(node);
  }

  const threadPaths: string[] = [];
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < angles.length - 1; i++) {
      const a = grid[i]![j]!;
      const b = grid[i + 1]![j]!;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      // Pull the control point toward the anchor (concave) and let it sag down.
      const toAnchorX = anchor.x - midX;
      const toAnchorY = anchor.y - midY;
      const inv = Math.hypot(toAnchorX, toAnchorY) || 1;
      const wobble = 1 + between(-jitter, jitter);
      const cx =
        midX + (toAnchorX / inv) * segLen * curve * wobble;
      const cy =
        midY + (toAnchorY / inv) * segLen * curve * wobble + segLen * gravity;
      threadPaths.push(`M${n(a.x)} ${n(a.y)}Q${n(cx)} ${n(cy)} ${n(b.x)} ${n(b.y)}`);
    }
  }

  return { radials: radialPaths, threads: threadPaths, nodes };
}
