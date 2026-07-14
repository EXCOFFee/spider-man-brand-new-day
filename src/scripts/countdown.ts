// Live countdown. The target instant is fixed in UTC and read from the DOM; the
// remaining time is always the delta against Date.now(), never the visitor's
// wall clock. Digits are plain text swaps (no per-digit animation), so there is
// nothing for reduced-motion to disable.

const root = document.querySelector<HTMLElement>("[data-countdown]");

if (root && root.dataset.target) {
  const target = Date.parse(root.dataset.target);
  const live = root.querySelector<HTMLElement>("[data-countdown-live]");
  const grid = root.querySelector<HTMLElement>("[data-countdown-grid]");
  const cells = {
    days: root.querySelector<HTMLElement>("[data-days]"),
    hours: root.querySelector<HTMLElement>("[data-hours]"),
    minutes: root.querySelector<HTMLElement>("[data-minutes]"),
    seconds: root.querySelector<HTMLElement>("[data-seconds]"),
  };

  const pad = (value: number): string => String(value).padStart(2, "0");

  const write = (cell: HTMLElement | null, value: string): void => {
    if (cell && cell.textContent !== value) cell.textContent = value;
  };

  let timer = 0;

  const tick = (): void => {
    const remaining = target - Date.now();
    if (remaining <= 0) {
      if (grid) grid.hidden = true;
      if (live) live.hidden = false;
      if (timer) clearInterval(timer);
      return;
    }
    let delta = remaining;
    const days = Math.floor(delta / 86_400_000);
    delta -= days * 86_400_000;
    const hours = Math.floor(delta / 3_600_000);
    delta -= hours * 3_600_000;
    const minutes = Math.floor(delta / 60_000);
    delta -= minutes * 60_000;
    const seconds = Math.floor(delta / 1000);
    write(cells.days, String(days));
    write(cells.hours, pad(hours));
    write(cells.minutes, pad(minutes));
    write(cells.seconds, pad(seconds));
  };

  tick();
  timer = window.setInterval(tick, 1000);
}

export {};
