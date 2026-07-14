// Counter client. Posts once on load (the increment is idempotent server-side),
// then renders the live value. The inline value is already on screen, so if any
// of this fails — JS off, Redis down, rate limited — the number still shows.

const root = document.querySelector<HTMLElement>("[data-counter]");
const valueEl = root?.querySelector<HTMLElement>("[data-counter-value]");

if (root && valueEl) {
  const start = Number(root.dataset.initial) || 0;
  const locale = root.dataset.locale === "en" ? "en-US" : "es-AR";
  const format = new Intl.NumberFormat(locale);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const render = (target: number): void => {
    if (reduce || target === start) {
      valueEl.textContent = format.format(target);
      return;
    }
    // Count-up tween. tabular-nums keeps the width fixed, so nothing reflows.
    const duration = 800;
    const t0 = performance.now();
    const ease = (x: number): number => 1 - (1 - x) ** 3;
    const step = (now: number): void => {
      const progress = Math.min(1, (now - t0) / duration);
      const value = Math.round(start + (target - start) * ease(progress));
      valueEl.textContent = format.format(value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const read = async (): Promise<number | null> => {
    try {
      const post = await fetch("/api/slingers", { method: "POST" });
      if (post.status === 200) {
        const data = (await post.json()) as { count?: unknown };
        if (typeof data.count === "number") return data.count;
      }
    } catch {
      // fall through to a plain read
    }
    try {
      const get = await fetch("/api/slingers");
      if (get.ok) {
        const data = (await get.json()) as { count?: unknown };
        if (typeof data.count === "number") return data.count;
      }
    } catch {
      // keep the inline fallback
    }
    return null;
  };

  void read().then((count) => {
    if (count !== null && Number.isFinite(count)) render(count);
  });
}

export {};
