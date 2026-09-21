import { Redis } from "@upstash/redis";
import { ROUND_COUNT, ROUNDS } from "./data";
import { scoreOrder } from "./scoring";
import type { LeaderboardRow, SessionState, Submission } from "./types";
import { isRoundIndex } from "./types";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

type MemoryStore = {
  session: SessionState;
  participants: Set<string>[];
  subs: Map<string, Submission>;
};

function emptyParticipants(): Set<string>[] {
  return Array.from({ length: ROUND_COUNT }, () => new Set<string>());
}

function memory(): MemoryStore {
  const globalStore = globalThis as typeof globalThis & {
    __rankingMemory?: MemoryStore;
  };
  if (
    !globalStore.__rankingMemory ||
    globalStore.__rankingMemory.participants.length !== ROUND_COUNT
  ) {
    globalStore.__rankingMemory = {
      session: { round: 0, phase: "idle" },
      participants: emptyParticipants(),
      subs: new Map(),
    };
  }
  return globalStore.__rankingMemory;
}

const DEFAULT_SESSION: SessionState = { round: 0, phase: "idle" };

function subKey(round: number, participantId: string) {
  return `sub:${round}:${participantId}`;
}

function participantsKey(round: number) {
  return `participants:${round}`;
}

export async function getSession(): Promise<SessionState> {
  if (redis) {
    const session = await redis.get<SessionState>("session");
    if (
      session &&
      isRoundIndex(session.round) &&
      (session.phase === "idle" ||
        session.phase === "voting" ||
        session.phase === "revealed")
    ) {
      return session;
    }
    return DEFAULT_SESSION;
  }
  return memory().session;
}

export async function setSession(session: SessionState): Promise<SessionState> {
  if (redis) {
    await redis.set("session", session);
    return session;
  }
  memory().session = session;
  return session;
}

export async function saveSubmission(
  round: number,
  participantId: string,
  submission: Submission,
): Promise<void> {
  if (redis) {
    await redis.set(subKey(round, participantId), submission);
    await redis.sadd(participantsKey(round), participantId);
    return;
  }
  const store = memory();
  store.subs.set(subKey(round, participantId), submission);
  store.participants[round].add(participantId);
}

export async function getSubmission(
  round: number,
  participantId: string,
): Promise<Submission | null> {
  if (redis) {
    return (await redis.get<Submission>(subKey(round, participantId))) ?? null;
  }
  return memory().subs.get(subKey(round, participantId)) ?? null;
}

export async function listParticipantIds(round: number): Promise<string[]> {
  if (redis) {
    return await redis.smembers(participantsKey(round));
  }
  return [...memory().participants[round]];
}

export async function submittedCount(round: number): Promise<number> {
  if (redis) {
    return await redis.scard(participantsKey(round));
  }
  return memory().participants[round].size;
}

export async function listSubmissions(round: number) {
  const ids = await listParticipantIds(round);
  if (ids.length === 0) return [];

  if (redis) {
    const values = await redis.mget<(Submission | null)[]>(
      ...ids.map((id) => subKey(round, id)),
    );
    return ids.flatMap((id, index) => {
      const submission = values[index];
      return submission ? [{ id, ...submission }] : [];
    });
  }

  const store = memory();
  return ids.flatMap((id) => {
    const submission = store.subs.get(subKey(round, id));
    return submission ? [{ id, ...submission }] : [];
  });
}

export async function resetGame(): Promise<SessionState> {
  if (redis) {
    const idsByRound = await Promise.all(
      ROUNDS.map((_, round) => redis.smembers(participantsKey(round))),
    );
    const keys = [
      "session",
      ...ROUNDS.map((_, round) => participantsKey(round)),
      ...idsByRound.flatMap((ids, round) =>
        ids.map((id) => subKey(round, id)),
      ),
    ];
    if (keys.length) await redis.del(...keys);
  } else {
    const store = memory();
    store.session = { ...DEFAULT_SESSION };
    store.participants = emptyParticipants();
    store.subs.clear();
  }
  return setSession({ ...DEFAULT_SESSION });
}

export async function getLeaderboard(): Promise<{
  session: SessionState;
  rows: LeaderboardRow[];
}> {
  const session = await getSession();
  const perRound = await Promise.all(
    ROUNDS.map((_, round) => listSubmissions(round)),
  );

  const byId = new Map<
    string,
    { name: string; orders: Array<string[] | null> }
  >();

  perRound.forEach((rows, round) => {
    for (const row of rows) {
      const existing = byId.get(row.id);
      if (existing) {
        existing.name = row.name;
        existing.orders[round] = row.order;
      } else {
        const orders: Array<string[] | null> = Array.from(
          { length: ROUND_COUNT },
          () => null,
        );
        orders[round] = row.order;
        byId.set(row.id, { name: row.name, orders });
      }
    }
  });

  const rows: LeaderboardRow[] = [...byId.entries()].map(
    ([participantId, value]) => {
      const roundScores = value.orders.map((order, round) =>
        order ? scoreOrder(order, ROUNDS[round]).total : 0,
      );
      return {
        participantId,
        name: value.name,
        submitted: value.orders.map(Boolean),
        roundScores,
        total: roundScores.reduce((sum, score) => sum + score, 0),
      };
    },
  );

  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return { session, rows };
}
