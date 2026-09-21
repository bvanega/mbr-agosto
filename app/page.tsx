"use client";

import { useState } from "react";
import { RankList } from "@/components/RankList";
import { ROUNDS, seededClientKeys, shuffledClientKeys } from "@/lib/data";
import { maxRoundPoints, scoreOrder } from "@/lib/scoring";

export default function Home() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [orders, setOrders] = useState<string[][]>(() =>
    ROUNDS.map((round, index) => seededClientKeys(round, index + 1)),
  );
  const [revealedRounds, setRevealedRounds] = useState<boolean[]>(() =>
    ROUNDS.map(() => false),
  );

  const round = ROUNDS[roundIndex];
  const order = orders[roundIndex];
  const revealed = revealedRounds[roundIndex];
  const result = scoreOrder(order, round);
  const maxPoints = maxRoundPoints(round.clients.length);

  const roundTotals = ROUNDS.map((item, index) =>
    revealedRounds[index] ? scoreOrder(orders[index], item).total : null,
  );
  const accumulated = roundTotals.reduce<number>(
    (sum, total) => sum + (total ?? 0),
    0,
  );
  const accumulatedMax = ROUNDS.reduce(
    (sum, item, index) =>
      sum + (revealedRounds[index] ? maxRoundPoints(item.clients.length) : 0),
    0,
  );
  const allRevealed = revealedRounds.every(Boolean);

  const updateOrder = (next: string[]) => {
    setOrders((prev) =>
      prev.map((value, index) => (index === roundIndex ? next : value)),
    );
  };

  const reveal = () => {
    setRevealedRounds((prev) =>
      prev.map((value, index) => (index === roundIndex ? true : value)),
    );
  };

  const reshuffle = () => updateOrder(shuffledClientKeys(round));

  const restart = () => {
    setOrders(ROUNDS.map((item) => shuffledClientKeys(item)));
    setRevealedRounds(ROUNDS.map(() => false));
    setRoundIndex(0);
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 pb-32 pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint">
          nk.studio · MBR
        </p>
        <p className="font-display text-sm text-muted">
          Acumulado{" "}
          <span className="font-semibold text-paper">
            {accumulated}
            {accumulatedMax > 0 ? ` / ${accumulatedMax}` : ""}
          </span>
        </p>
      </div>

      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight">
        Ranking de Clientes
      </h1>

      <div className="mt-6 rounded-[16px] border border-line bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Ronda {roundIndex + 1} / {ROUNDS.length}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{round.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {revealed
            ? "Resultado revelado. Cada tarjeta muestra la posición real y los puntos."
            : `Armen el ranking entre todos: del 1º al 5º por profit, y los ${round.worstCount === 1 ? "peores" : `${round.worstCount} peores`} abajo.`}
        </p>

        {revealed ? (
          <div className="mt-4 flex items-baseline gap-3 border-t border-line pt-4">
            <span className="font-display text-4xl font-semibold text-mint">
              {result.total}
            </span>
            <span className="text-base text-muted">
              de {maxPoints} puntos en esta ronda
            </span>
          </div>
        ) : null}
      </div>

      <section className="mt-6">
        <RankList
          clients={round.clients}
          order={order}
          onChange={revealed ? undefined : updateOrder}
          disabled={revealed}
          showValues={revealed}
          scores={revealed ? result.cards : undefined}
          lastPos={round.totalClients}
          worstCount={round.worstCount}
        />
      </section>

      {allRevealed ? (
        <section className="mt-8">
          <h3 className="mb-3 font-display text-lg font-semibold">Resumen</h3>
          <ol className="overflow-hidden rounded-[16px] border border-line bg-panel">
            {ROUNDS.map((item, index) => (
              <li
                key={item.title}
                className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <span className="w-8 font-display text-lg font-semibold text-mint">
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 truncate text-paper">{item.title}</p>
                <span className="font-display text-lg font-semibold text-paper">
                  {roundTotals[index]}
                  <span className="ml-1 text-sm font-medium text-muted">
                    / {maxRoundPoints(item.clients.length)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => setRoundIndex((prev) => Math.max(0, prev - 1))}
            disabled={roundIndex === 0}
            className="min-h-14 rounded-[16px] border border-line bg-panel-2 px-4 text-sm text-paper disabled:opacity-30"
          >
            Anterior
          </button>

          {revealed ? (
            <button
              type="button"
              onClick={() =>
                setRoundIndex((prev) => Math.min(ROUNDS.length - 1, prev + 1))
              }
              disabled={roundIndex === ROUNDS.length - 1}
              className="min-h-14 flex-1 rounded-[16px] bg-mint px-5 text-base font-semibold text-ink disabled:opacity-30"
            >
              Siguiente ronda
            </button>
          ) : (
            <button
              type="button"
              onClick={reveal}
              className="min-h-14 flex-1 rounded-[16px] bg-mint px-5 text-base font-semibold text-ink"
            >
              Revelar resultado
            </button>
          )}

          <button
            type="button"
            onClick={revealed ? restart : reshuffle}
            className="min-h-14 rounded-[16px] border border-line bg-panel-2 px-4 text-sm text-paper"
          >
            {revealed ? "Reiniciar" : "Mezclar"}
          </button>
        </div>
      </div>
    </main>
  );
}
