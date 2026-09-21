"use client";

import { RankList } from "@/components/RankList";
import { StatusBanner } from "@/components/StatusBanner";
import { ROUNDS, shuffledClientKeys } from "@/lib/data";
import { maxRoundPoints, scoreOrder } from "@/lib/scoring";
import { useSession } from "@/lib/use-session";
import { useEffect, useMemo, useState } from "react";

const ID_KEY = "ranking-participant-id";
const NAME_KEY = "ranking-participant-name";

// localStorage y no sessionStorage: si el celular recarga o abre otra pestaña,
// el jugador sigue siendo el mismo para el servidor.
function getOrCreateId() {
  const existing = localStorage.getItem(ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(ID_KEY, id);
  return id;
}

function orderKey(round: number) {
  return `ranking-order-${round}`;
}

function readStoredOrder(round: number): string[] | null {
  const raw = localStorage.getItem(orderKey(round));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

type MySubmission = { round: number; order: string[] };

export default function PlayPage() {
  const { session, error: sessionError } = useSession();
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [orderContext, setOrderContext] = useState("");
  const [submission, setSubmission] = useState<MySubmission | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated && typeof window !== "undefined") {
    setHydrated(true);
    const storedName = localStorage.getItem(NAME_KEY);
    if (storedName) {
      setName(storedName);
      setJoined(true);
    }
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
      localStorage.setItem(orderKey(session.round), JSON.stringify(next));
      setError(null);
    }
  }

  const roundIndex = session?.round;
  const phase = session?.phase;

  // La respuesta enviada la manda el servidor, no el navegador: así la
  // revelación no depende de lo que haya quedado guardado en el celular.
  useEffect(() => {
    if (!joined || roundIndex === undefined) return;
    let cancelled = false;

    const load = async () => {
      try {
        const id = getOrCreateId();
        const res = await fetch(
          `/api/submit?round=${roundIndex}&participantId=${encodeURIComponent(id)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          submission: { name: string; order: string[] } | null;
        };
        if (cancelled) return;
        setSubmission(
          json.submission
            ? { round: roundIndex, order: json.submission.order }
            : null,
        );
      } catch {
        // reintenta cuando cambie la ronda o la fase
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [joined, roundIndex, phase]);

  const round = session ? ROUNDS[session.round] : ROUNDS[0];
  const hasSubmitted =
    session !== null && submission !== null && submission.round === session.round;

  const correctOrder = useMemo(
    () =>
      [...round.clients]
        .sort((a, b) => a.correctPos - b.correctPos)
        .map((client) => client.key),
    [round],
  );

  const result = useMemo(() => {
    if (!session || session.phase !== "revealed" || !hasSubmitted) return null;
    return scoreOrder(submission!.order, round);
  }, [hasSubmitted, submission, round, session]);

  const updateOrder = (next: string[]) => {
    setOrder(next);
    if (session) {
      localStorage.setItem(orderKey(session.round), JSON.stringify(next));
    }
  };

  const enter = () => {
    const next = name.trim();
    if (!next) return;
    localStorage.setItem(NAME_KEY, next);
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
      localStorage.setItem(orderKey(session.round), JSON.stringify(order));
      setSubmission({ round: session.round, order });
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
        {session
          ? `Ronda ${session.round + 1} / ${ROUNDS.length} — ${round.title}`
          : "Ranking de Clientes"}
      </h1>

      <StatusBanner storage={session?.storage} error={sessionError} />

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
            Ordená el top 5 y los peores del período. Los slots de abajo son el
            peor profit.
          </p>
          <div className="mt-5">
            <RankList
              clients={round.clients}
              order={hasSubmitted ? submission!.order : order}
              onChange={hasSubmitted ? undefined : updateOrder}
              disabled={hasSubmitted}
              lastPos={round.totalClients}
              worstCount={round.worstCount}
            />
          </div>
          {hasSubmitted ? (
            <p className="mt-5 text-center text-sm text-mint">
              Respuesta enviada. Esperá la revelación.
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-center text-sm text-red">{error}</p>
          ) : null}
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
                <span className="ml-2 text-base font-medium text-muted">
                  / {maxRoundPoints(round.clients.length)}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">
              No enviaste respuesta esta ronda. Este es el orden real.
            </p>
          )}
          <div className="mt-5">
            <RankList
              clients={round.clients}
              order={result ? result.cards.map((card) => card.key) : correctOrder}
              disabled
              showValues
              scores={result?.cards}
              lastPos={round.totalClients}
              worstCount={round.worstCount}
            />
          </div>
        </>
      )}
    </main>
  );
}
