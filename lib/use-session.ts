"use client";

import { useEffect, useState } from "react";
import { POLL_MS, type SessionState } from "./types";

export type SessionPayload = SessionState & { submittedCount: number };

export function useSession(interval = POLL_MS) {
  const [data, setData] = useState<SessionPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SessionPayload;
        if (!cancelled) setData(json);
      } catch {
        // polling retry on next interval
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), interval);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [interval]);

  return data;
}
