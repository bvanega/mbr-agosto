import { ROUND_COUNT } from "./data";

export type Phase = "idle" | "voting" | "revealed";

export type SessionState = {
  round: number;
  phase: Phase;
};

export type Submission = {
  name: string;
  order: string[];
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
