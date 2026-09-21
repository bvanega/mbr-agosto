# Ranking de Clientes

Juego para el MBR. El presentador controla las rondas desde `/host` y el equipo juega desde el celular en `/play`.

## Configurar el store (obligatorio para jugar online)

El estado de la sesión se comparte vía Upstash Redis. Sin eso, cada instancia serverless de Vercel tendría su propia copia y la ronda se reiniciaría sola.

1. Creá una base en [Upstash](https://upstash.com) o desde Vercel → Storage → Upstash Redis.
2. Cargá estas variables en el proyecto de Vercel (Production, Preview y Development):

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Si usás la integración de Vercel y te inyecta `KV_REST_API_URL` / `KV_REST_API_TOKEN`, también sirven: la app acepta los dos juegos de nombres.

3. Después de deployar, abrí `https://tu-app.vercel.app/api/health`. Tiene que responder:

```json
{ "ok": true, "storage": "redis", "configured": true }
```

Si devuelve `503`, faltan las variables o no se redeployó después de cargarlas.

## Correr local

```bash
cd nk-internal/mbr
npm install
npm run dev
```

En local, sin variables de entorno, el estado vive en memoria del proceso de dev. Alcanza para probar desde varios dispositivos contra la misma `npm run dev`, pero no para producción.

## Cómo se juega

Tres rondas, una por período, con 6 u 8 tarjetas de clientes sin montos.

1. Presentador: **Abrir ronda**.
2. Equipo: arrastran del 1º al 5º por profit, más los peores puestos del período, y tocan **Enviar respuesta**.
3. Presentador: **Revelar resultado**. Cada jugador ve su puntaje y el presentador el leaderboard acumulado.
4. **Siguiente ronda** y repetir.

Cada tarjeta da hasta 20 puntos, restando 2 por cada posición de distancia. Al revelar, el borde izquierdo indica el puntaje y el fondo se pone rojo si el profit real del cliente fue negativo.

## Endpoints

| Ruta | Para qué |
|---|---|
| `GET /api/health` | Estado del store y sesión actual |
| `GET/POST /api/session` | Ronda y fase |
| `GET/POST /api/submit` | Respuesta de un jugador |
| `GET /api/leaderboard` | Puntajes acumulados |

## Logos

`components/ClientLogo.tsx` intenta en cascada: `/public/logos/{key}.png` → `https://logo.clearbit.com/{domain}` → iniciales. Los `domain` de `lib/data.ts` están vacíos; completalos o subí los PNG a `public/logos/`.
