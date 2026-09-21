function RevealStats({
  profit,
  revenue,
  costoEquipo,
}: {
  profit: number;
  revenue: number;
  costoEquipo: number;
}) {
  const margin =
    revenue === 0 ? "s/d" : `${((profit / revenue) * 100).toFixed(1)}%`;
  const profitColor = profit >= 0 ? "text-[var(--mint)]" : "text-[var(--red)]";

  return (
    <div className="mt-1.5 flex flex-col gap-0.5">
      <div
        className={`font-display text-lg font-bold leading-tight ${profitColor}`}
      >
        {profit < 0 ? "-" : ""}USD {Math.abs(Math.round(profit)).toLocaleString("es-AR")}
        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          Profit
        </span>
      </div>
      <div className="text-xs text-muted">
        Revenue: USD {Math.round(revenue).toLocaleString("es-AR")}
      </div>
      <div className="text-xs text-muted">
        Costo equipo: USD {Math.round(costoEquipo).toLocaleString("es-AR")}
      </div>
      <div className="text-xs text-muted">Margen: {margin}</div>
    </div>
  );
}

export default RevealStats;
