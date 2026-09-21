import { Redis } from "@upstash/redis";
import { ROUND_COUNT, ROUNDS } from "./data";
import { scoreOrder } from "./scoring";
import { MAX_ROUND, isPhase, isRoundIndex } from "./types";
import type {
  LeaderboardRow,
  SessionState,
  StorageMode,
  Submission,
} from "./types";

// Según cómo se haya conectado Upstash, Vercel inyecta nombres distintos: los
// UPSTASH_* del alta manual, los KV_* de la integración, o los KV_* con el
// prefijo que se haya elegido al instalarla. Aceptamos las tres formas.
const URL_VARS = [
  "UPSTASH_REDIS_REST_URL",
  "KV_REST_API_URL",
  "UPSTASH_REDIS_REST_KV_REST_API_URL",
] as const;
const TOKEN_VARS = [
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
] as const;

function firstEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

const url = firstEnv(URL_VARS);
const token = firstEnv(TOKEN_VARS);

export const redis = url && token ? new Redis({ url, token }) : null;

// Sin Redis el estado no se comparte entre instancias serverless, así que en
// producción preferimos fallar visiblemente antes que simular una sesión.
const allowMemory = !redis && process.env.NODE_ENV !== "production";

export const storageMode: StorageMode = redis ? "redis" : "memory";

export class StoreUnavailableError extends Error {
  constructor() {
    super(
      "Falta configurar Upstash Redis: definí UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (o KV_REST_API_URL y KV_REST_API_TOKEN) en el proyecto.",
    );
    this.name = "StoreUnavailableError";
  }
}

export function storageStatus() {
  return {
    storage: storageMode,
    configured: Boolean(redis),
    allowMemory,
    envSeen: [...URL_VARS, ...TOKEN_VARS].filter((name) =>
      Boolean(process.env[name]),
    ),
  };
}

type MemoryStore = {
  session: SessionState;
  participants: Set<string>[];
  subs: Map<string, Submission>;
};

function emptyParticipants(): Set<string>[] {
  return Array.from({ length: ROUND_COUNT }, () => new Set<string>());
}

function memory(): MemoryStore {
  if (!allowMemory) throw new StoreUnavailableError();

  const globalStore = globalThis as typeof globalThis & {
    __rankingMemory?: MemoryStore;
  };
  if (
    !globalStore.__rankingMemory ||
    globalStore.__rankingMemory.participants.length !== ROUND_COUNT
  ) {
    globalStore.__rankingMemory = {
      session: { round: 0, phase: "idle", updatedAt: Date.now() },
      participants: emptyParticipants(),
      subs: new Map(),
    };
  }
  return globalStore.__rankingMemory;
}

function defaultSession(): SessionState {
  return { round: 0, phase: "idle", updatedAt: 0 };
}

function subKey(round: number, participantId: string) {
  return `sub:${round}:${participantId}`;
}

function participantsKey(round: number) {
  return `participants:${round}`;
}

function parseSession(raw: unknown): SessionState | null {
  const value =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return null;
          }
        })()
      : raw;

  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SessionState>;
  if (!isPhase(candidate.phase)) return null;

  // Una ronda fuera de rango (por ejemplo guardada por una versión anterior con
  // más rondas) se acota en vez de descartar la sesión entera.
  const round = isRoundIndex(candidate.round)
    ? candidate.round
    : typeof candidate.round === "number"
      ? Math.min(Math.max(Math.trunc(candidate.round), 0), MAX_ROUND)
      : 0;

  return {
    round,
    phase: candidate.phase,
    updatedAt:
      typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
  };
}

export async function getSession(): Promise<SessionState> {
  if (redis) {
    const raw = await redis.get("session");
    return parseSession(raw) ?? defaultSession();
  }
  return memory().session;
}

export async function setSession(
  session: Omit<SessionState, "updatedAt">,
): Promise<SessionState> {
  const next: SessionState = { ...session, updatedAt: Date.now() };
  if (redis) {
    await redis.set("session", next);
    return next;
  }
  memory().session = next;
  return next;
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
    const raw = await redis.get(subKey(round, participantId));
    return parseSubmission(raw);
  }
  return memory().subs.get(subKey(round, participantId)) ?? null;
}

function parseSubmission(raw: unknown): Submission | null {
  const value =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return null;
          }
        })()
      : raw;

  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Submission>;
  if (typeof candidate.name !== "string" || !Array.isArray(candidate.order)) {
    return null;
  }
  return { name: candidate.name, order: candidate.order as string[] };
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
    const values = await redis.mget<unknown[]>(
      ...ids.map((id) => subKey(round, id)),
    );
    return ids.flatMap((id, index) => {
      const submission = parseSubmission(values[index]);
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
      ...ROUNDS.map((_, round) => participantsKey(round)),
      ...idsByRound.flatMap((ids, round) =>
        ids.map((id) => subKey(round, id)),
      ),
    ];
    if (keys.length) await redis.del(...keys);
  } else {
    const store = memory();
    store.participants = emptyParticipants();
    store.subs.clear();
  }
  return setSession({ round: 0, phase: "idle" });
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
