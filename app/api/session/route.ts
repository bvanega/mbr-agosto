import { errorResponse } from "@/lib/api";
import {
  getSession,
  resetGame,
  setSession,
  storageMode,
  submittedCount,
} from "@/lib/redis";
import { MAX_ROUND, isPhase, isRoundIndex } from "@/lib/types";
import type { SessionState } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function payload(session: SessionState) {
  return {
    ...session,
    submittedCount: await submittedCount(session.round),
    storage: storageMode,
  };
}

export async function GET() {
  try {
    return Response.json(await payload(await getSession()));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      phase?: unknown;
      round?: unknown;
    };

    if (body.action === "reset") {
      return Response.json(await payload(await resetGame()));
    }

    const current = await getSession();
    let next: Omit<SessionState, "updatedAt"> = {
      round: current.round,
      phase: current.phase,
    };

    if (body.action === "open") {
      next.phase = "voting";
    } else if (body.action === "reveal") {
      next.phase = "revealed";
    } else if (body.action === "prev") {
      next = { round: Math.max(0, current.round - 1), phase: "idle" };
    } else if (body.action === "next") {
      next = { round: Math.min(MAX_ROUND, current.round + 1), phase: "idle" };
    } else {
      if (isRoundIndex(body.round)) next.round = body.round;
      if (isPhase(body.phase)) next.phase = body.phase;
      if (isRoundIndex(body.round) && body.phase === undefined) {
        next.phase = "idle";
      }
    }

    return Response.json(await payload(await setSession(next)));
  } catch (error) {
    return errorResponse(error);
  }
}
