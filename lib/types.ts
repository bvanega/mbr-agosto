export type Phase = "idle" | "voting" | "revealed";

export type SessionState = {
  round: 0 | 1;
  phase: Phase;
};

export type Submission = {
  name: string;
  order: string[];
};

export type LeaderboardRow = {
  participantId: string;
  name: string;
  submitted: [boolean, boolean];
  roundScores: [number, number];
  total: number;
};

export const POLL_MS = 1800;
export const MAX_ROUND = 1;
