// Subtle pointer reaction for the web nodes. Movement is derived from the
// distance between each node and the cursor, and applied with `transform` only
// so it stays on the compositor. rAF-throttled; the whole thing is a few
// dozen style writes per frame.

const svg = document.querySelector<SVGSVGElement>("[data-web]");

if (svg) {
  const nodes = Array.from(svg.querySelectorAll<SVGCircleElement>(".web-node")).map(
    (el) => ({
      el,
      x: Number(el.getAttribute("cx")),
      y: Number(el.getAttribute("cy")),
    }),
  );
  const viewBox = svg.viewBox.baseVal;
  const INFLUENCE = 24; // radius of effect, in viewBox units
  const PUSH = 3; // max displacement, in viewBox units

  let frame = 0;
  let px = -1e3;
  let py = -1e3;

  const paint = (): void => {
    frame = 0;
    for (const node of nodes) {
      const dx = node.x - px;
      const dy = node.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist > INFLUENCE) {
        node.el.style.transform = "";
        continue;
      }
      const falloff = (1 - dist / INFLUENCE) ** 2;
      const step = (falloff * PUSH) / (dist || 1);
      node.el.style.transform = `translate(${(dx * step).toFixed(2)}px, ${(dy * step).toFixed(2)}px)`;
    }
  };

  const schedule = (): void => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  addEventListener(
    "pointermove",
    (event) => {
      const rect = svg.getBoundingClientRect();
      px = ((event.clientX - rect.left) / rect.width) * viewBox.width;
      py = ((event.clientY - rect.top) / rect.height) * viewBox.height;
      schedule();
    },
    { passive: true },
  );

  addEventListener("pointerleave", () => {
    px = -1e3;
    py = -1e3;
    schedule();
  });
}

export {};
