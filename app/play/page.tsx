"use client";

import { RankList } from "@/components/RankList";
import { ROUNDS, shuffledClientKeys } from "@/lib/data";
import { scoreOrder } from "@/lib/scoring";
import { useSession } from "@/lib/use-session";
import { useMemo, useState } from "react";

const ID_KEY = "ranking-participant-id";
const NAME_KEY = "ranking-participant-name";
const SUBMITTED_KEY = "ranking-submitted-round";

function getOrCreateId() {
  const existing = sessionStorage.getItem(ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(ID_KEY, id);
  return id;
}

function orderKey(round: number) {
  return `ranking-order-${round}`;
}

function readStoredOrder(round: number): string[] | null {
  const raw = sessionStorage.getItem(orderKey(round));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export default function PlayPage() {
  const session = useSession();
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [orderContext, setOrderContext] = useState("");
  const [submittedRound, setSubmittedRound] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated && typeof window !== "undefined") {
    setHydrated(true);
    const storedName = sessionStorage.getItem(NAME_KEY);
    const storedSubmitted = sessionStorage.getItem(SUBMITTED_KEY);
    if (storedName) {
      setName(storedName);
      setJoined(true);
    }
    if (storedSubmitted !== null) setSubmittedRound(Number(storedSubmitted));
  }

  const context = session ? `${session.round}:${session.phase}` : "";
  if (
    session &&
    context !== orderContext &&
    (session.phase === "voting" || session.phase === "revealed")
  ) {
    setOrderContext(context);
    const stored = readStoredOrder(session.round);
    if (stored) {
      setOrder(stored);
    } else if (session.phase === "voting") {
      const next = shuffledClientKeys(ROUNDS[session.round]);
      setOrder(next);
      sessionStorage.setItem(orderKey(session.round), JSON.stringify(next));
      setError(null);
    }
  }

  const round = session ? ROUNDS[session.round] : ROUNDS[0];
  const hasSubmitted = session ? submittedRound === session.round : false;
  const correctOrder = useMemo(
    () =>
      [...round.clients]
        .sort((a, b) => a.correctPos - b.correctPos)
        .map((client) => client.key),
    [round],
  );

  const result = useMemo(() => {
    if (!session || session.phase !== "revealed" || !hasSubmitted) return null;
    return scoreOrder(order, round);
  }, [hasSubmitted, order, round, session]);

  const updateOrder = (next: string[]) => {
    setOrder(next);
    if (session) {
      sessionStorage.setItem(orderKey(session.round), JSON.stringify(next));
    }
  };

  const enter = () => {
    const next = name.trim();
    if (!next) return;
    sessionStorage.setItem(NAME_KEY, next);
    setName(next);
    setJoined(true);
  };

  const submit = async () => {
    if (!session) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: getOrCreateId(),
          name: name.trim(),
          round: session.round,
          order,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo enviar");
        return;
      }
      sessionStorage.setItem(SUBMITTED_KEY, String(session.round));
      sessionStorage.setItem(orderKey(session.round), JSON.stringify(order));
      setSubmittedRound(session.round);
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (!joined) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint">
          Equipo
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          ¿Cómo te llamás?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Lo usamos solo para el leaderboard de esta reunión.
        </p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") enter();
          }}
          placeholder="Tu nombre"
          autoComplete="nickname"
          className="mt-8 min-h-14 rounded-[16px] border border-line bg-panel-2 px-4 text-base text-paper outline-none placeholder:text-muted focus:border-mint"
        />
        <button
          type="button"
          onClick={enter}
          disabled={!name.trim()}
          className="mt-3 min-h-14 rounded-[16px] bg-mint text-base font-semibold text-ink disabled:opacity-40"
        >
          Entrar
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pb-28 pt-7">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint">
        Hola, {name}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        {session ? round.title : "Ranking de Clientes"}
      </h1>

      {!session ? (
        <p className="mt-8 text-muted">Conectando con la sala…</p>
      ) : session.phase === "idle" ? (
        <div className="mt-10 rounded-[16px] border border-line bg-panel px-5 py-10 text-center">
          <p className="font-display text-xl font-semibold">En espera</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Esperando a que el presentador abra la ronda…
          </p>
        </div>
      ) : session.phase === "voting" ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Ordená del 1º al 5º. El último slot es el último lugar.
          </p>
          <div className="mt-5">
            <RankList
              clients={round.clients}
              order={order}
              onChange={hasSubmitted ? undefined : updateOrder}
              disabled={hasSubmitted}
            />
          </div>
          {hasSubmitted ? (
            <p className="mt-5 text-center text-sm text-mint">
              Respuesta enviada. Esperá la revelación.
            </p>
          ) : null}
          {error ? <p className="mt-3 text-center text-sm text-red">{error}</p> : null}
          {!hasSubmitted ? (
            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ink/95 p-4 backdrop-blur">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={sending || order.length === 0}
                className="mx-auto flex min-h-14 w-full max-w-md items-center justify-center rounded-[16px] bg-mint text-base font-semibold text-ink disabled:opacity-40"
              >
                {sending ? "Enviando…" : "Enviar respuesta"}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {result ? (
            <div className="mt-4 rounded-[16px] border border-line bg-panel px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Tu puntaje esta ronda
              </p>
              <p className="font-display text-4xl font-semibold text-mint">
                {result.total}
                <span className="ml-2 text-base font-medium text-muted">/ 120</span>
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              No enviaste respuesta esta ronda.
            </p>
          )}
          <div className="mt-5">
            <RankList
              clients={round.clients}
              order={result ? result.cards.map((card) => card.key) : correctOrder}
              disabled
              showValues
              scores={result?.cards}
            />
          </div>
        </>
      )}
    </main>
  );
}
