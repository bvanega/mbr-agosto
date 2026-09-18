import { clientsByKey, type Round } from "./data";

export function guessedPosValue(index: number): number {
  return index < 5 ? index + 1 : 11;
}

export function pointsFor(guessedPos: number, correctPos: number): number {
  const distance = Math.abs(guessedPos - correctPos);
  return Math.max(0, 20 - distance * 2);
}

export type CardScore = {
  key: string;
  name: string;
  guessedPos: number;
  correctPos: number;
  points: number;
  value: number;
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
    const guessedPos = guessedPosValue(index);
    cards.push({
      key,
      name: client.name,
      guessedPos,
      correctPos: client.correctPos,
      points: pointsFor(guessedPos, client.correctPos),
      value: client.value,
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
