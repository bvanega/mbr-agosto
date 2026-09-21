import { StoreUnavailableError } from "./redis";

export function errorResponse(error: unknown) {
  if (error instanceof StoreUnavailableError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  console.error("[ranking]", error);
  const message =
    error instanceof Error ? error.message : "Error inesperado del servidor";
  return Response.json({ error: message }, { status: 500 });
}
