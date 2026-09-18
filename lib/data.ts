export type Client = {
  key: string;
  name: string;
  correctPos: number;
  value: number;
};

export type Round = {
  title: string;
  metric: string;
  clients: Client[];
};

export const ROUNDS: Round[] = [
  {
    title: "Ranking por Profit — Agosto 2026",
    metric: "Profit",
    clients: [
      { key: "c0", name: "The Electric Factory", correctPos: 1, value: 25298.64 },
      { key: "c1", name: "Veritran", correctPos: 2, value: 17843.0 },
      { key: "c2", name: "Astranova", correctPos: 3, value: 13961.93 },
      { key: "c3", name: "Unicef", correctPos: 4, value: 8626.23 },
      { key: "c4", name: "Emeritus", correctPos: 5, value: 8440.39 },
      { key: "c5", name: "MRM McCann", correctPos: 11, value: 0.0 },
    ],
  },
  {
    title: "Ranking por Revenue Reconocido — Agosto 2026",
    metric: "Revenue",
    clients: [
      { key: "c0", name: "Veritran", correctPos: 1, value: 31809.49 },
      { key: "c1", name: "The Electric Factory", correctPos: 2, value: 25711.28 },
      { key: "c2", name: "Unicef", correctPos: 3, value: 19468.75 },
      { key: "c3", name: "Astranova", correctPos: 4, value: 16173.0 },
      { key: "c4", name: "Emeritus", correctPos: 5, value: 10990.0 },
      { key: "c5", name: "MRM McCann", correctPos: 11, value: 0.0 },
    ],
  },
];

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function shuffledClientKeys(round: Round): string[] {
  return shuffle(round.clients.map((client) => client.key));
}

export function clientsByKey(round: Round): Map<string, Client> {
  return new Map(round.clients.map((client) => [client.key, client]));
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
