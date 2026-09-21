import type { StorageMode } from "@/lib/types";

export function StatusBanner({
  storage,
  error,
}: {
  storage?: StorageMode;
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="mt-4 rounded-[16px] border border-red/60 bg-red/10 px-4 py-3 text-sm leading-relaxed text-paper">
        {error}
      </div>
    );
  }

  // En producción el server corta con 503 si falta Redis, así que este aviso
  // solo aparece corriendo local.
  if (storage === "memory") {
    return (
      <p className="mt-3 text-xs text-muted">
        Modo local: el estado vive en memoria del server de desarrollo.
      </p>
    );
  }

  return null;
}
