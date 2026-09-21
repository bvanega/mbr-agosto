import { getSession, storageStatus } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const status = storageStatus();
  try {
    const session = await getSession();
    return Response.json({ ok: true, ...status, session });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        ...status,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
