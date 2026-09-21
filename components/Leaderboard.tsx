import type { LeaderboardRow } from "@/lib/types";

export function Leaderboard({
  rows,
  revealScores,
  highlightName,
}: {
  rows: LeaderboardRow[];
  revealScores: boolean;
  highlightName?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[16px] border border-line bg-panel px-4 py-6 text-sm text-muted">
        Todavía no hay respuestas.
      </p>
    );
  }

  return (
    <ol className="overflow-hidden rounded-[16px] border border-line bg-panel">
      {rows.map((row, index) => {
        const mine =
          highlightName &&
          row.name.trim().toLowerCase() === highlightName.trim().toLowerCase();
        return (
          <li
            key={row.participantId}
            className={`flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 ${
              mine ? "bg-mint/10" : ""
            }`}
          >
            <span className="w-8 font-display text-lg font-semibold text-mint">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-paper">{row.name}</p>
              <p className="text-xs text-muted">
                {row.submitted
                  .map((done, roundIndex) => (done ? `R${roundIndex + 1} ✓` : `R${roundIndex + 1} —`))
                  .join(" · ")}
                {revealScores ? ` · ${row.roundScores.join(" + ")}` : ""}
              </p>
            </div>
            {revealScores ? (
              <span className="font-display text-xl font-semibold text-paper">
                {row.total}
              </span>
            ) : (
              <span className="text-xs uppercase tracking-wider text-muted">
                enviado
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
