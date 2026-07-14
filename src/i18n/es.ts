export const es = {
  htmlLang: "es",
  meta: {
    title: "Spider-Man: Brand New Day — cuenta regresiva",
    description:
      "Un homenaje de fan, no oficial. Identidad visual original hecha con codigo, cuenta regresiva al estreno y un contador global de fans que aguanta el pico.",
  },
  skipToContent: "Saltar al contenido",
  hero: {
    eyebrow: "Estreno mundial",
    date: "29 . 07 . 2026",
    titleLine1: "Spider-Man",
    titleLine2: "Brand New Day",
    tagline:
      "Un dia nuevo sobre la ciudad. La misma pregunta de siempre: cuando todo cambia, quien elegis ser.",
    cta: "Ver la cuenta regresiva",
    slingers: {
      label: "web-slingers listos",
      note: "Sumate al conteo",
      action: "Contame",
      counted: "Ya estas en el conteo",
    },
  },
  countdown: {
    heading: "Cuenta regresiva al estreno",
    units: {
      days: "dias",
      hours: "horas",
      minutes: "minutos",
      seconds: "segundos",
    },
    live: "El estreno ya llego",
  },
  synopsis: {
    heading: "La historia",
    body: [
      "La ciudad amanece distinta. Las mismas calles, los mismos techos, pero algo en el aire cambio de lugar mientras nadie miraba.",
      "Entre una azotea y la siguiente hay una decision que no admite ensayo: seguir colgado del pasado o soltar el hilo y confiar en el proximo balanceo.",
      "Brand New Day es eso: la manana despues de todo, cuando empezar de nuevo deja de ser una amenaza y se vuelve una eleccion.",
    ],
  },
  multiverse: {
    heading: "Hilos que se cruzan",
    intro:
      "Cada viñeta es un pliegue distinto de la misma manana. Se revelan a medida que bajas.",
    panels: [
      {
        title: "El salto",
        body: "Ningun balanceo es seguro hasta que ya lo diste. La fisica es fe con testigos.",
      },
      {
        title: "La caida",
        body: "Caer no es lo contrario de volar. Es la parte del vuelo que nadie fotografia.",
      },
      {
        title: "La ciudad",
        body: "Ocho millones de historias mirando hacia arriba, esperando ver a alguien que no se rinde.",
      },
      {
        title: "El regreso",
        body: "Siempre hay una ventana encendida al final del dia. Ese es el punto de anclaje.",
      },
    ],
  },
  tech: {
    heading: "Como se sostiene el pico",
    intro:
      "Esta landing esta pensada para el 29/07: un dia de trafico concentrado. El contenido es estatico y vive en el borde; lo unico dinamico es el contador, disenado como el peor caso posible.",
    metrics: [
      { label: "JavaScript enviado", value: "~1 KB", note: "sin librerias de animacion" },
      { label: "Peso total de la home", value: "< 15 KB", note: "imagenes criticas: 0 KB" },
      { label: "LCP objetivo", value: "< 1.2 s", note: "el LCP es texto, no una imagen" },
      { label: "Lecturas a Redis", value: "≤ 6 / min / PoP", note: "el resto lo absorbe el cache de edge" },
    ],
    note: "Los numeros medidos del load test y del experimento con Redis caido estan en el repositorio.",
    cta: "Ver la ingenieria en el repo",
  },
  footer: {
    disclaimerHeading: "Aviso legal",
    disclaimerEs:
      "Proyecto de fan, no oficial. Sin afiliacion ni respaldo de Marvel, Sony Pictures o sus licenciantes. Todos los elementos visuales de este sitio son originales. Spider-Man es una marca registrada de Marvel Characters, Inc.",
    disclaimerEn:
      "Unofficial fan project. Not affiliated with or endorsed by Marvel, Sony Pictures, or their licensors. All visual elements on this site are original. Spider-Man is a registered trademark of Marvel Characters, Inc.",
    repo: "Codigo en GitHub",
    fontCredit: "Tipografia display: Anton, bajo SIL Open Font License 1.1.",
  },
  langSwitch: {
    label: "Idioma",
    toEn: "English",
    toEs: "Español",
  },
};
