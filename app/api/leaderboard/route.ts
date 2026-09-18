import { getLeaderboard } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const board = await getLeaderboard();
  return Response.json(board);
}
