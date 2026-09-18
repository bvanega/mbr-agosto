import {
  getSession,
  resetGame,
  setSession,
  submittedCount,
} from "@/lib/redis";
import type { Phase, SessionState } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isPhase(value: unknown): value is Phase {
  return value === "idle" || value === "voting" || value === "revealed";
}

function isRound(value: unknown): value is 0 | 1 {
  return value === 0 || value === 1;
}

export async function GET() {
  const session = await getSession();
  const count = await submittedCount(session.round);
  return Response.json({ ...session, submittedCount: count });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    phase?: unknown;
    round?: unknown;
  };

  if (body.action === "reset") {
    const session = await resetGame();
    return Response.json({ ...session, submittedCount: 0 });
  }

  const current = await getSession();
  let next: SessionState = { ...current };

  if (body.action === "open") {
    next = { ...current, phase: "voting" };
  } else if (body.action === "reveal") {
    next = { ...current, phase: "revealed" };
  } else if (body.action === "prev") {
    next = { round: 0, phase: "idle" };
  } else if (body.action === "next") {
    next = { round: 1, phase: "idle" };
  } else {
    if (isRound(body.round)) next.round = body.round;
    if (isPhase(body.phase)) next.phase = body.phase;
    if (isRound(body.round) && body.phase === undefined) next.phase = "idle";
  }

  const session = await setSession(next);
  const count = await submittedCount(session.round);
  return Response.json({ ...session, submittedCount: count });
}
