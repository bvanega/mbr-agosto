"use client";

import { useEffect, useState } from "react";
import { POLL_MS, type SessionState } from "./types";

export type SessionPayload = SessionState & {
  submittedCount: number;
  // #region agent log
  __debug?: Record<string, unknown>;
  // #endregion
};

export function useSession(interval = POLL_MS) {
  const [data, setData] = useState<SessionPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SessionPayload;
        // #region agent log
        fetch('http://127.0.0.1:7799/ingest/69afb160-ab63-4848-884b-498fe351088a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6bbbe4'},body:JSON.stringify({sessionId:'6bbbe4',hypothesisId:'A,B,C,E',location:'lib/use-session.ts:24',message:'poll GET /api/session',data:{path:window.location.pathname,round:json.round,phase:json.phase,submittedCount:json.submittedCount,debug:json.__debug},timestamp:Date.now()})}).catch(()=>{});
        console.log('[dbg] poll', json.round, json.phase, json.__debug);
        // #endregion
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
