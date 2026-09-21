# Ranking de Clientes

Juego para el MBR. El presentador comparte pantalla y el equipo arma el ranking en vivo, sobre una sola pantalla.

## Correr local

```bash
cd nk-internal/mbr
npm install
npm run dev
```

Abrí `http://localhost:3000`. No necesita base de datos, variables de entorno ni backend: todo el estado vive en el navegador.

## Deploy en Vercel

```bash
npx vercel
```

O conectá el repo desde el dashboard. No hay env vars que configurar.

## Cómo se juega

Tres rondas, una por período. En cada una hay 6 u 8 tarjetas de clientes sin montos.

1. Entre todos arrastran las tarjetas: 1º a 5º por profit, y abajo los peores puestos del período (`#49`, `#50`, `#51`, por ejemplo).
2. **Revelar resultado** muestra profit, revenue, costo de equipo y margen de cada cliente, más los puntos de cada tarjeta.
3. **Siguiente ronda** y repetir. Al final aparece el resumen con el puntaje de las tres.

Cada tarjeta da hasta 20 puntos, restando 2 por cada posición de distancia. Al revelar, el borde izquierdo indica el puntaje (mint / gold / rojo) y el fondo se pone rojo si el profit real del cliente fue negativo.

## Logos

`components/ClientLogo.tsx` intenta en cascada: `/public/logos/{key}.png` → `https://logo.clearbit.com/{domain}` → iniciales. Los `domain` de `lib/data.ts` están vacíos; completalos o subí los PNG a `public/logos/`.
