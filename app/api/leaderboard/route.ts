import { errorResponse } from "@/lib/api";
import { getLeaderboard } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getLeaderboard());
  } catch (error) {
    return errorResponse(error);
  }
}
