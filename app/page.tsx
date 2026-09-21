import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint">
        nk.studio · MBR
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight">
        Ranking de Clientes
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Tres rondas: top 5 y los peores del período. El presentador abre y revela cada una.
      </p>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/host"
          className="flex min-h-16 items-center justify-center rounded-[16px] bg-mint px-5 text-center text-lg font-semibold text-ink"
        >
          Soy el presentador
        </Link>
        <Link
          href="/play"
          className="flex min-h-16 items-center justify-center rounded-[16px] border border-line bg-panel px-5 text-center text-lg font-semibold text-paper"
        >
          Soy del equipo
        </Link>
      </div>
    </main>
  );
}
