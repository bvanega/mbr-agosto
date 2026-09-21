export type Client = {
  key: string;
  name: string;
  correctPos: number;
  profit: number;
  revenue: number;
  costoEquipo: number;
  domain: string;
};

export type Round = {
  title: string;
  totalClients: number;
  worstCount: number;
  clients: Client[];
};

export const ROUNDS: Round[] = [
  {
    title: "Agosto 2026",
    totalClients: 12,
    worstCount: 1,
    clients: [
      { key: "c0", name: "The Electric Factory", correctPos: 1, profit: 25298.64, revenue: 25711.28, costoEquipo: 412.64, domain: "" },
      { key: "c1", name: "Veritran", correctPos: 2, profit: 17843.0, revenue: 31809.49, costoEquipo: 13616.49, domain: "" },
      { key: "c2", name: "Astranova", correctPos: 3, profit: 13961.93, revenue: 16173.0, costoEquipo: 2211.07, domain: "" },
      { key: "c3", name: "Unicef", correctPos: 4, profit: 8626.23, revenue: 19468.75, costoEquipo: 10842.52, domain: "" },
      { key: "c4", name: "Emeritus", correctPos: 5, profit: 8440.39, revenue: 10990.0, costoEquipo: 49.61, domain: "" },
      { key: "c5", name: "/nk.studio ®", correctPos: 12, profit: -36965.43, revenue: 0.0, costoEquipo: 36965.43, domain: "" },
    ],
  },
  {
    title: "Todo 2025",
    totalClients: 51,
    worstCount: 3,
    clients: [
      { key: "c0", name: "Veritran", correctPos: 1, profit: 200522.72, revenue: 347499.87, costoEquipo: 143477.15, domain: "" },
      { key: "c1", name: "The Electric Factory", correctPos: 2, profit: 154571.93, revenue: 608734.12, costoEquipo: 454162.19, domain: "" },
      { key: "c2", name: "Gut", correctPos: 3, profit: 87878.14, revenue: 88290.0, costoEquipo: 411.86, domain: "" },
      { key: "c3", name: "Untold", correctPos: 4, profit: 65927.56, revenue: 129330.17, costoEquipo: 63402.61, domain: "" },
      { key: "c4", name: "Tryolabs", correctPos: 5, profit: 54204.35, revenue: 96289.96, costoEquipo: 42085.61, domain: "" },
      { key: "c5", name: "Bunker DB", correctPos: 49, profit: -10672.22, revenue: 7670.72, costoEquipo: 18342.94, domain: "" },
      { key: "c6", name: "Lucciano's", correctPos: 50, profit: -39533.51, revenue: 44187.08, costoEquipo: 83720.59, domain: "" },
      { key: "c7", name: "/nk.studio ®", correctPos: 51, profit: -282989.13, revenue: 0.0, costoEquipo: 282989.13, domain: "" },
    ],
  },
  {
    title: "2026 (acumulado al 16 sep)",
    totalClients: 29,
    worstCount: 3,
    clients: [
      { key: "c0", name: "Veritran", correctPos: 1, profit: 237252.51, revenue: 352411.54, costoEquipo: 114809.03, domain: "" },
      { key: "c1", name: "The Electric Factory", correctPos: 2, profit: 93750.13, revenue: 186935.61, costoEquipo: 93185.48, domain: "" },
      { key: "c2", name: "Inprotur", correctPos: 3, profit: 64704.61, revenue: 80019.67, costoEquipo: 15315.06, domain: "" },
      { key: "c3", name: "Suku", correctPos: 4, profit: 59982.43, revenue: 62093.75, costoEquipo: 2111.32, domain: "" },
      { key: "c4", name: "Unicef", correctPos: 5, profit: 48602.09, revenue: 72843.75, costoEquipo: 24241.66, domain: "" },
      { key: "c5", name: "Tryolabs", correctPos: 27, profit: -10223.8, revenue: -6000.0, costoEquipo: 4223.8, domain: "" },
      { key: "c6", name: "Pomelo", correctPos: 28, profit: -46991.54, revenue: 25666.67, costoEquipo: 72658.2, domain: "" },
      { key: "c7", name: "/nk.studio ®", correctPos: 29, profit: -274143.33, revenue: 0.0, costoEquipo: 274143.33, domain: "" },
    ],
  },
];

export const ROUND_COUNT = ROUNDS.length;

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
