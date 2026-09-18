import { Redis } from "@upstash/redis";
import { ROUNDS } from "./data";
import { scoreOrder } from "./scoring";
import type { LeaderboardRow, SessionState, Submission } from "./types";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

type MemoryStore = {
  session: SessionState;
  participants: [Set<string>, Set<string>];
  subs: Map<string, Submission>;
};

function memory(): MemoryStore {
  const globalStore = globalThis as typeof globalThis & {
    __rankingMemory?: MemoryStore;
  };
  if (!globalStore.__rankingMemory) {
    globalStore.__rankingMemory = {
      session: { round: 0, phase: "idle" },
      participants: [new Set(), new Set()],
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
      (session.round === 0 || session.round === 1) &&
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
  round: 0 | 1,
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
  round: 0 | 1,
  participantId: string,
): Promise<Submission | null> {
  if (redis) {
    return (await redis.get<Submission>(subKey(round, participantId))) ?? null;
  }
  return memory().subs.get(subKey(round, participantId)) ?? null;
}

export async function listParticipantIds(round: 0 | 1): Promise<string[]> {
  if (redis) {
    return await redis.smembers(participantsKey(round));
  }
  return [...memory().participants[round]];
}

export async function submittedCount(round: 0 | 1): Promise<number> {
  if (redis) {
    return await redis.scard(participantsKey(round));
  }
  return memory().participants[round].size;
}

export async function listSubmissions(round: 0 | 1) {
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
    const ids0 = await redis.smembers(participantsKey(0));
    const ids1 = await redis.smembers(participantsKey(1));
    const keys = [
      "session",
      participantsKey(0),
      participantsKey(1),
      ...ids0.map((id) => subKey(0, id)),
      ...ids1.map((id) => subKey(1, id)),
    ];
    if (keys.length) await redis.del(...keys);
  } else {
    const store = memory();
    store.session = { ...DEFAULT_SESSION };
    store.participants[0].clear();
    store.participants[1].clear();
    store.subs.clear();
  }
  return setSession({ ...DEFAULT_SESSION });
}

export async function getLeaderboard(): Promise<{
  session: SessionState;
  rows: LeaderboardRow[];
}> {
  const session = await getSession();
  const [round0, round1] = await Promise.all([
    listSubmissions(0),
    listSubmissions(1),
  ]);

  const byId = new Map<
    string,
    { name: string; orders: [string[] | null, string[] | null] }
  >();

  for (const row of round0) {
    byId.set(row.id, { name: row.name, orders: [row.order, null] });
  }
  for (const row of round1) {
    const existing = byId.get(row.id);
    if (existing) {
      existing.name = row.name;
      existing.orders[1] = row.order;
    } else {
      byId.set(row.id, { name: row.name, orders: [null, row.order] });
    }
  }

  const rows: LeaderboardRow[] = [...byId.entries()].map(
    ([participantId, value]) => {
      const score0 = value.orders[0]
        ? scoreOrder(value.orders[0], ROUNDS[0]).total
        : 0;
      const score1 = value.orders[1]
        ? scoreOrder(value.orders[1], ROUNDS[1]).total
        : 0;
      return {
        participantId,
        name: value.name,
        submitted: [Boolean(value.orders[0]), Boolean(value.orders[1])],
        roundScores: [score0, score1],
        total: score0 + score1,
      };
    },
  );

  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return { session, rows };
}
