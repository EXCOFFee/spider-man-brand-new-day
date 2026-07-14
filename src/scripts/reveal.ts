// Scroll reveal via IntersectionObserver. The hidden state lives in CSS behind
// the `.js` flag, so this only ever adds the "visible" class — if it never runs,
// the content is already on screen.

const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");

if (elements.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  for (const element of elements) observer.observe(element);
}

export {};
