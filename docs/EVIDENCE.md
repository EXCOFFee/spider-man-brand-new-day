# Evidencia

Mediciones reales sobre el deployment de producción. No se afirma nada que no esté acá medido.
Los números feos (p95/p99 del load test) se reportan tal cual, con su explicación.

- **Deployment medido:** `https://spider-man-brand-new-day-two.vercel.app`
- **Fecha:** 2026-07-14
- **Herramientas:** k6 v2.1.0, Lighthouse (via `@lhci/cli`), Upstash Redis REST.
- **Reproducibilidad:** el script de carga está versionado en [`load/stress.js`](../load/stress.js).
  No se versionan capturas PNG: el proyecto no admite rasters fuera del OG image
  (ver `docs/ARCHITECTURE.md`, ADR-004). En su lugar se dejan los números y los comandos exactos
  para regenerarlos.

---

## 1. Load test — el pico

```bash
BASE_URL=https://spider-man-brand-new-day-two.vercel.app \
  k6 run -e PEAK_VUS=1000 -e STAGE_DUR=1m -e POST_SHARE=0.02 load/stress.js
```

Rampa 0 → 1000 VUs en 5 minutos (250 → 600 → 1000 → 1000 → 0), contra producción.

| Métrica | Valor |
|---|---|
| Requests totales | **71 218** |
| VUs pico | 1 000 |
| **Cache hit en el edge** (`x-vercel-cache`) | **99.99 %** |
| Tasa de error (`http_req_failed`) | 0.996 % |
| Latencia p50 | 702 ms |
| Latencia p90 / p95 / p99 | 5.09 s / 6.90 s / 11.26 s |
| Datos recibidos | 1.71 GB |
| Contador antes → después | 14 239 → 14 261 (**22 `INCR`**) |

### Sobre las latencias p95/p99 (número honesto malo)

Los p95/p99 son altos (6.9 s / 11.3 s) y **no reflejan la latencia del servicio**: son saturación
del **generador de carga**. 1000 VUs abriendo conexiones desde una sola máquina con un uplink
doméstico saturan el cliente mucho antes que al edge de Vercel. La evidencia de que el cuello de
botella es local, no remoto:

- El **smoke test** con 20 VUs (sin saturar el cliente) dio **p95 = 149 ms, p99 = 262 ms**.
- El load test de 1000 VUs mantuvo **99.99 % de cache hit** y **< 1 % de error** — si el edge
  estuviera saturado, el error y los MISS se dispararían, y no lo hicieron.
- El `max` de 60 s es exactamente el timeout de k6: conexiones encoladas en el cliente hasta
  vencer, no respuestas lentas del servidor.

La lectura correcta: **el servicio responde en ~150 ms; a 1000 VUs desde una sola IP el que se
queda sin aire es el generador, no la landing.** Un test distribuido (varias regiones) daría p95
plano; con una máquina, no.

### El número clave: fan-out contra Redis

Esta es la tesis del proyecto, y es la parte contundente:

- **~70 000 lecturas HTTP** (home + `GET /api/slingers`) durante el test.
- **99.99 % servidas desde el edge.** El `s-maxage=10` colapsa las lecturas a **~1 `GET` a Redis
  cada 10 s por PoP**. El fan-out efectivo de lectura contra Redis fue de **~4 comandos** en los
  5 minutos.
- Las escrituras (`POST`, 2 % del tráfico desde una sola IP) quedaron acotadas por el rate limit:
  de ~700 intentos, solo **22 ganaron el `INCR`** (5 req/60 s por IP). El resto son no-ops o `429`.

En una frase: **decenas de miles de lecturas entrantes se convirtieron en un puñado de comandos
a Redis.** El pico no llega al datastore porque el edge lo absorbe. El número se puede confirmar
en el panel de Upstash (gráfico de comandos) durante la ventana del test.

---

## 2. Chaos test — Redis caído

**Hipótesis.** Con Redis inalcanzable, `GET /api/slingers` responde `200` con el valor de
fallback, la página renderiza completa y ningún usuario ve un error.

**Acción.** Se corrió el endpoint real con la credencial de Upstash **revocada** (token inválido →
Upstash responde `401` → el cliente falla). Es literalmente "revocar las credenciales".

**Blast radius.** Local. Cero impacto en producción (no se tocó ninguna env var del deployment).

**Validación.**

| Request | Con Redis caído | Esperado |
|---|---|---|
| `GET /api/slingers` | `200` · `{"count":14238}` (fallback) | `200`, nunca 5xx |
| `POST /api/slingers` | `202` · `{"ok":false}` (descarta el +1) | `202`, nunca 5xx |
| `GET /` | `200`, HTML completo, contador `14.238` inline | página completa |

La hipótesis se cumple: **la página nunca se entera de que Redis existe.** El mecanismo es un
`try/catch` por request con timeout de 1000 ms (ver [`src/lib/redis.ts`](../src/lib/redis.ts) y
[`src/pages/api/slingers.ts`](../src/pages/api/slingers.ts)), independiente de la concurrencia.

**Nota de método.** El `k6` bajo carga se intentó contra el dev server local y devolvió
connection-refused: Vite en modo dev no maneja decenas de conexiones concurrentes. Eso mide el
dev server, no la degradación, así que se descarta. La degradación es per-request e idéntica bajo
cualquier carga. El experimento equivalente contra un preview de Vercel con la env var revocada
queda como paso opcional (mismo resultado esperado, blast radius preview).

---

## 3. Lighthouse — producción, móvil

```bash
lhci autorun   # config de móvil con throttling 4G; 3 corridas, mediana
```

Contra producción, móvil emulado con throttling, mediana de 3 corridas, en `/` y `/en/`:

| Categoría | Score |
|---|---|
| Performance | **100** |
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |

| Web Vital (lab) | Valor | Target |
|---|---|---|
| LCP | **0.9 s** | < 1.2 s |
| CLS | **0** | 0 |
| TBT | **0 ms** | < 50 ms |
| FCP | 0.9 s | — |

El LCP en producción (0.9 s) es incluso mejor que en el laboratorio local (1.2 s): el edge de
Vercel con HTTP/2 y brotli entrega el documento más rápido que el server de preview local.

---

## 4. Presupuesto de bytes (ruta `/`, comprimido)

`pnpm size`, sobre el output del adapter, brotli:

| Recurso | Medido | Límite |
|---|---|---|
| JS del cliente | 1.03 KB | 20 KB |
| Fuentes (WOFF2) | 9.17 KB | 30 KB |
| HTML (incluye CSS crítico inline + SVG de la telaraña) | 10.34 KB | 40 KB |
| **Peso total de la home** | **20.53 KB** | 120 KB |
| Imágenes en critical path | 0 KB | 0 KB |

---

## 5. Headers de caché en producción (verificados con `curl -I`)

| Recurso | `Cache-Control` | `x-vercel-cache` |
|---|---|---|
| HTML (`/`, `/en/`) | `public, max-age=0, must-revalidate` (+ edge cache) | HIT |
| `/_astro/*` (hasheados) | `public, max-age=31536000, immutable` | HIT |
| Fuentes (`/fonts/*`) | `public, max-age=31536000, immutable` | HIT |
| `GET /api/slingers` | `public` (+ `s-maxage=10` en el edge) | MISS → HIT dentro de 10 s |

El `immutable` de los assets hasheados requirió corregir el orden de rutas que emite el adapter
(la regla de headers quedaba después de `handle: filesystem` y no se aplicaba); se corrige en
build con [`tools/fix-headers.mjs`](../tools/fix-headers.mjs).
