import { clientsByKey, type Round } from "./data";

export function guessedPosValue(
  index: number,
  totalClients: number,
  worstCount: number,
): number {
  if (index < 5) return index + 1;
  const j = index - 5;
  const offsetFromEnd = worstCount - 1 - j;
  return totalClients - offsetFromEnd;
}

export function labelFor(
  index: number,
  totalClients: number,
  worstCount: number,
): string {
  if (index < 5) return `${index + 1}º`;
  return `${guessedPosValue(index, totalClients, worstCount)}`;
}

export function pointsFor(guessedPos: number, correctPos: number): number {
  const distance = Math.abs(guessedPos - correctPos);
  return Math.max(0, 20 - distance * 2);
}

export function marginPct(profit: number, revenue: number): string {
  if (revenue === 0) return "s/d";
  return `${((profit / revenue) * 100).toFixed(1)}%`;
}

export type CardScore = {
  key: string;
  name: string;
  guessedPos: number;
  correctPos: number;
  points: number;
};

export function scoreOrder(
  order: string[],
  round: Round,
): { cards: CardScore[]; total: number } {
  const lookup = clientsByKey(round);
  const cards: CardScore[] = [];

  order.forEach((key, index) => {
    const client = lookup.get(key);
    if (!client) return;
    const guessedPos = guessedPosValue(
      index,
      round.totalClients,
      round.worstCount,
    );
    cards.push({
      key,
      name: client.name,
      guessedPos,
      correctPos: client.correctPos,
      points: pointsFor(guessedPos, client.correctPos),
    });
  });

  return {
    cards,
    total: cards.reduce((sum, card) => sum + card.points, 0),
  };
}

export function scoreTone(points: number): "mint" | "gold" | "red" {
  if (points >= 16) return "mint";
  if (points >= 8) return "gold";
  return "red";
}

export function isLastPlace(pos: number, totalClients: number): boolean {
  return pos === totalClients;
}

export function maxRoundPoints(clientCount: number): number {
  return clientCount * 20;
}
