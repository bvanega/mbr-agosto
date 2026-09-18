# Ranking de Clientes

Mini-juego multiplayer para el MBR. El presentador abre y revela cada ronda; el equipo ordena 6 clientes desde el celular.

## Setup local

```bash
cd nk-internal/mbr
npm install
cp .env.example .env.local
```

Creá un Redis en [Upstash](https://upstash.com) (o Vercel Marketplace → Upstash Redis) y copiá:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

```bash
npm run dev
```

Abrí `/` en la laptop (presentador → `/host`) y `/play` en los celulares. Sin Redis, el estado vive en memoria del proceso local: sirve para probar la UI, no para varios deploys/serverless.

## Deploy en Vercel

```bash
npx vercel
```

O conectá el repo en el dashboard. Agregá las mismas env vars en el proyecto de Vercel.

Probar `/`, `/host` y `/play` en un celular real antes de la reunión.

## Cómo se juega

1. Presentador: **Abrir ronda**
2. Equipo: arrastrar 1º–5º + Último lugar → **Enviar respuesta**
3. Presentador: **Revelar resultado** (leaderboard acumulado)
4. **Siguiente ronda** y repetir

Máximo 120 pts por ronda (6 × 20). Verde ≥16, amarillo ≥8, rojo &lt;8.
