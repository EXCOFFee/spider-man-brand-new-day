# Spider-Man: Brand New Day — landing

Proyecto de fan, no oficial. Sin afiliacion ni respaldo de Marvel, Sony Pictures o sus
licenciantes. Toda la identidad visual es original y generada por codigo (CSS/SVG). No se usa
ningun asset licenciado.

- Demo: TODO (completar en deploy)
- Repositorio: TODO (completar en deploy)

## La tesis

La consigna pide una landing que **aguante un pico de trafico masivo**. El contenido de esta
pagina es fijo: no hay usuario autenticado ni datos que cambien por request. Eso define el
problema con precision: el 99% de la pagina es un artefacto inmutable que se pre-computa una vez
y se sirve desde el borde. La unica pieza dinamica es un contador global, y esta disenado a
proposito como el peor caso posible: todas las escrituras van a una misma clave.

El detalle completo de las decisiones esta en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
Las mediciones que las respaldan estan en [`docs/EVIDENCE.md`](docs/EVIDENCE.md).

## Stack

- **Astro 5** con adapter de Vercel. Cero JS por defecto; se paga JS solo por la unica isla
  interactiva (ADR-001).
- **Tailwind v4** con tokens del sistema de diseno definidos una sola vez en `@theme`.
- **Upstash Redis** para el contador, absorbido por el cache de edge (ADR-002, ADR-006).
- Sin librerias de animacion. Solo se animan `transform` y `opacity` (ADR-003).

## Presupuesto de performance

Limites duros que el CI hace cumplir. Si un cambio los excede, el build se pone rojo.

| Recurso | Presupuesto | Umbral de error |
|---|---|---|
| JS (ruta `/`) | 15 KB | 20 KB |
| CSS | 20 KB | 25 KB |
| Fuentes | 25 KB | 30 KB |
| Imagenes criticas | 0 KB | 1 KB |
| Peso total de la home | 100 KB | 120 KB |
| LCP (movil, 4G) | < 1.2 s | — |
| CLS | 0 | — |
| Lighthouse mobile | 100/100/100/100 | piso |

## Desarrollo

Requiere Node >= 22 y pnpm.

```bash
pnpm install
pnpm dev
```

Para el endpoint del contador en local, definir las variables de Upstash en `.env` (ver
`.env.example`). Sin ellas la pagina renderiza igual: el contador cae al valor de fallback
embebido en el HTML.

## Definition of Done

El proyecto esta terminado cuando estos comandos pasan en verde:

```bash
pnpm check          # astro check -> 0 errores
pnpm lint           # eslint -> 0 errores
pnpm build          # build exitoso
pnpm size           # presupuesto de bytes dentro de limites
pnpm check:secrets  # sin credenciales en el bundle del cliente
pnpm test:a11y      # axe-core -> 0 violaciones serias/criticas
pnpm lhci           # Lighthouse -> 100/100/100/100 mobile
pnpm load           # load test k6 (requiere URL de produccion)
```

## Decisiones de alcance

Lo que se dejo afuera a proposito, no por olvido:

- **View Transitions entre rutas (`<ClientRouter />`).** Se evaluo y se descarto. El sitio tiene
  dos rutas y un unico link entre idiomas; los ~6 KB de runtime son un 30-40% del presupuesto de
  JS a cambio de una transicion apenas perceptible (la pagina cambia de idioma por completo).
  La navegacion nativa de una home de ~20 KB servida desde el borde ya es instantanea.
- **Interaccion de la telaraña en touch.** No hay puntero fino, asi que la telaraña se sirve
  estatica y el JS de interaccion ni se descarga. Mismo comportamiento con `prefers-reduced-motion`.

## Accesibilidad

Todo operable por teclado con foco visible. Contraste verificado >= 4.5:1. Con
`prefers-reduced-motion: reduce` no hay ni un solo movimiento. `axe-core` corre en CI.

## Licencia y creditos

El codigo se publica bajo la licencia del repositorio. La fuente display se distribuye bajo su
propia licencia libre, versionada en [`public/fonts/LICENSE`](public/fonts/LICENSE).

Spider-Man es una marca registrada de Marvel Characters, Inc. Este sitio no esta afiliado a
Marvel ni a Sony Pictures.
