import { ROUNDS } from "@/lib/data";
import { getSession, saveSubmission } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    participantId?: string;
    name?: string;
    round?: number;
    order?: string[];
  };

  const participantId = body.participantId?.trim();
  const name = body.name?.trim();
  const order = body.order;

  if (!participantId || !name || !Array.isArray(order)) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const session = await getSession();
  if (session.phase !== "voting") {
    return Response.json(
      { error: "La ronda no está abierta para votar" },
      { status: 409 },
    );
  }
  if (body.round !== undefined && body.round !== session.round) {
    return Response.json({ error: "Ronda desactualizada" }, { status: 409 });
  }

  const round = ROUNDS[session.round];
  const allowed = new Set(round.clients.map((client) => client.key));
  if (order.length !== round.clients.length || order.some((key) => !allowed.has(key))) {
    return Response.json({ error: "Orden inválido" }, { status: 400 });
  }
  if (new Set(order).size !== order.length) {
    return Response.json({ error: "Orden inválido" }, { status: 400 });
  }

  await saveSubmission(session.round, participantId, { name, order });
  return Response.json({ ok: true, round: session.round });
}
