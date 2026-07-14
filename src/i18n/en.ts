export const en = {
  htmlLang: "en",
  meta: {
    title: "Spider-Man: Brand New Day — countdown",
    description:
      "An unofficial fan tribute. Original visual identity built entirely in code, a countdown to release, and a global fan counter engineered to hold the spike.",
  },
  skipToContent: "Skip to content",
  hero: {
    eyebrow: "Worldwide release",
    date: "07 . 29 . 2026",
    titleLine1: "Spider-Man",
    titleLine2: "Brand New Day",
    tagline:
      "A new day over the city. The same old question: when everything changes, who do you choose to be.",
    cta: "See the countdown",
    slingers: {
      label: "web-slingers ready",
    },
  },
  countdown: {
    heading: "Countdown to release",
    units: {
      days: "days",
      hours: "hours",
      minutes: "minutes",
      seconds: "seconds",
    },
    live: "The release is here",
  },
  synopsis: {
    heading: "The story",
    body: [
      "The city wakes up different. Same streets, same rooftops, but something in the air moved while no one was watching.",
      "Between one rooftop and the next there is a choice that allows no rehearsal: stay hooked to the past, or let go of the thread and trust the next swing.",
      "Brand New Day is exactly that: the morning after everything, when starting over stops being a threat and becomes a choice.",
    ],
  },
  multiverse: {
    heading: "Threads that cross",
    intro: "Each panel is a different fold of the same morning. They reveal as you scroll.",
    panels: [
      {
        title: "The leap",
        body: "No swing is safe until you have already taken it. Physics is faith with witnesses.",
      },
      {
        title: "The fall",
        body: "Falling is not the opposite of flying. It is the part of flight no one photographs.",
      },
      {
        title: "The city",
        body: "Eight million stories looking up, waiting to see someone who does not give up.",
      },
      {
        title: "The return",
        body: "There is always one lit window at the end of the day. That is the anchor point.",
      },
    ],
  },
  tech: {
    heading: "How the spike holds",
    intro:
      "This landing is built for July 29: a day of concentrated traffic. The content is static and lives at the edge; the only dynamic piece is the counter, designed as the worst possible case.",
    metrics: [
      { label: "JavaScript shipped", value: "1 KB", note: "no animation libraries" },
      { label: "Total home weight", value: "21 KB", note: "critical images: 0 KB" },
      { label: "LCP in production", value: "0.9 s", note: "the LCP is text, not an image" },
      { label: "Cache hit under load", value: "99.99%", note: "70k reads, ~4 hit Redis" },
    ],
    note: "Measured load-test numbers and the Redis-down experiment live in the repository.",
    cta: "See the engineering in the repo",
  },
  footer: {
    disclaimerHeading: "Legal notice",
    disclaimerEs:
      "Proyecto de fan, no oficial. Sin afiliacion ni respaldo de Marvel, Sony Pictures o sus licenciantes. Todos los elementos visuales de este sitio son originales. Spider-Man es una marca registrada de Marvel Characters, Inc.",
    disclaimerEn:
      "Unofficial fan project. Not affiliated with or endorsed by Marvel, Sony Pictures, or their licensors. All visual elements on this site are original. Spider-Man is a registered trademark of Marvel Characters, Inc.",
    repo: "Code on GitHub",
    fontCredit: "Display type: Anton, under the SIL Open Font License 1.1.",
  },
  langSwitch: {
    label: "Language",
    toEn: "English",
    toEs: "Español",
  },
};
