"use client";

import { Leaderboard } from "@/components/Leaderboard";
import { RankList } from "@/components/RankList";
import { StatusBanner } from "@/components/StatusBanner";
import { ROUNDS, seededClientKeys } from "@/lib/data";
import type { LeaderboardRow, SessionPayload } from "@/lib/types";
import { useSession } from "@/lib/use-session";
import { useEffect, useMemo, useState } from "react";

export default function HostPage() {
  const { session, error, apply } = useSession();
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const round = session ? ROUNDS[session.round] : ROUNDS[0];
  const roundIndex = session?.round ?? 0;
  const previewOrder = useMemo(
    () => seededClientKeys(round, roundIndex + 1),
    [round, roundIndex],
  );
  const correctOrder = useMemo(
    () =>
      [...round.clients]
        .sort((a, b) => a.correctPos - b.correctPos)
        .map((client) => client.key),
    [round],
  );

  const act = async (action: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as SessionPayload & { error?: string };
      if (!res.ok) {
        setActionError(json?.error ?? "No se pudo actualizar la sesión");
        return;
      }
      // Aplicamos la respuesta al instante para no depender del próximo poll.
      apply(json);
    } catch {
      setActionError("Sin conexión con el servidor");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { rows: LeaderboardRow[] };
        if (!cancelled) setBoard(json.rows);
      } catch {
        // reintenta en el próximo poll
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 1800);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [session?.round, session?.phase]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint">
        Presentador
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        Ranking de Clientes
      </h1>

      <StatusBanner storage={session?.storage} error={actionError ?? error} />

      {!session ? (
        <p className="mt-8 text-muted">Conectando…</p>
      ) : (
        <>
          <div className="mt-6 rounded-[16px] border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Ronda {session.round + 1} / {ROUNDS.length} · {session.phase}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              {round.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {session.submittedCount} respuesta
              {session.submittedCount === 1 ? "" : "s"} esta ronda
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy || session.phase !== "idle"}
              onClick={() => void act("open")}
              className="min-h-14 rounded-[16px] bg-mint px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Abrir ronda
            </button>
            <button
              type="button"
              disabled={busy || session.phase !== "voting"}
              onClick={() => void act("reveal")}
              className="min-h-14 rounded-[16px] border border-line bg-panel px-4 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              Revelar resultado
            </button>
            <button
              type="button"
              disabled={busy || session.round === 0}
              onClick={() => void act("prev")}
              className="min-h-12 rounded-[16px] border border-line bg-panel-2 px-4 text-sm text-paper disabled:opacity-40"
            >
              Ronda anterior
            </button>
            <button
              type="button"
              disabled={busy || session.round === ROUNDS.length - 1}
              onClick={() => void act("next")}
              className="min-h-12 rounded-[16px] border border-line bg-panel-2 px-4 text-sm text-paper disabled:opacity-40"
            >
              Siguiente ronda
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm("¿Reiniciar toda la sesión y borrar respuestas?")
              ) {
                void act("reset");
              }
            }}
            className="mt-3 text-xs text-muted underline decoration-line underline-offset-4"
          >
            Reiniciar juego
          </button>

          <section className="mt-8">
            <h3 className="mb-3 font-display text-lg font-semibold">
              {session.phase === "revealed"
                ? "Orden real"
                : "Clientes (sin montos)"}
            </h3>
            <RankList
              clients={round.clients}
              order={
                session.phase === "revealed" ? correctOrder : previewOrder
              }
              disabled
              showValues={session.phase === "revealed"}
              lastPos={round.totalClients}
              worstCount={round.worstCount}
            />
          </section>

          <section className="mt-8 pb-10">
            <h3 className="mb-3 font-display text-lg font-semibold">
              Leaderboard
            </h3>
            <Leaderboard
              rows={board}
              revealScores={session.phase === "revealed"}
            />
          </section>
        </>
      )}
    </main>
  );
}
