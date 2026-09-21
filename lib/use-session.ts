"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POLL_MS, type SessionPayload } from "./types";

export type SessionResult = {
  session: SessionPayload | null;
  error: string | null;
  apply: (payload: SessionPayload) => void;
};

export function useSession(interval = POLL_MS): SessionResult {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastUpdatedAt = useRef(0);

  const apply = useCallback((payload: SessionPayload) => {
    if (payload.updatedAt < lastUpdatedAt.current) return;
    lastUpdatedAt.current = payload.updatedAt;
    setSession(payload);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const json = (await res.json()) as SessionPayload & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          // Mantenemos el último estado conocido: un error puntual no debe
          // hacer que la pantalla vuelva a la ronda 1.
          setError(json?.error ?? `Error ${res.status}`);
          return;
        }
        apply(json);
      } catch {
        if (!cancelled) setError("Sin conexión con el servidor");
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), interval);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [interval, apply]);

  return { session, error, apply };
}
