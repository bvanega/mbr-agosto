import { ROUND_COUNT } from "./data";

export type Phase = "idle" | "voting" | "revealed";

export type SessionState = {
  round: number;
  phase: Phase;
  // Marca de escritura: el cliente descarta respuestas de polling más viejas
  // que la última que ya aplicó.
  updatedAt: number;
};

export type Submission = {
  name: string;
  order: string[];
};

export type StorageMode = "redis" | "memory";

export type SessionPayload = SessionState & {
  submittedCount: number;
  storage: StorageMode;
};

export type LeaderboardRow = {
  participantId: string;
  name: string;
  submitted: boolean[];
  roundScores: number[];
  total: number;
};

export const POLL_MS = 1800;
export const MAX_ROUND = ROUND_COUNT - 1;

export function isRoundIndex(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < ROUND_COUNT
  );
}

export function isPhase(value: unknown): value is Phase {
  return value === "idle" || value === "voting" || value === "revealed";
}
