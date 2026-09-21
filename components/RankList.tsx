"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, type HTMLAttributes } from "react";
import ClientLogo from "@/components/ClientLogo";
import RevealStats from "@/components/RevealStats";
import { type Client } from "@/lib/data";
import { isLastPlace, labelFor, type CardScore } from "@/lib/scoring";

function posLabel(pos: number, lastPos: number) {
  return isLastPlace(pos, lastPos) ? "el peor" : `${pos}º`;
}

type RankListProps = {
  clients: Client[];
  order: string[];
  onChange?: (order: string[]) => void;
  disabled?: boolean;
  scores?: CardScore[];
  showValues?: boolean;
  lastPos?: number;
  worstCount?: number;
};

export function RankList({
  clients,
  order,
  onChange,
  disabled = false,
  scores,
  showValues = false,
  lastPos = 11,
  worstCount = 1,
}: RankListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const lookup = useMemo(
    () => new Map(clients.map((client) => [client.key, client])),
    [clients],
  );
  const scoreLookup = useMemo(
    () => new Map((scores ?? []).map((card) => [card.key, card])),
    [scores],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !onChange) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(order, oldIndex, newIndex));
  };

  const activeClient = activeId ? lookup.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2">
          {order.map((key, index) => {
            const client = lookup.get(key);
            if (!client) return null;
            return (
              <li key={key}>
                {index === 5 ? (
                  <p className="mb-1.5 mt-3 font-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                    {worstCount === 1 ? "Último lugar" : "Peor profit"}
                  </p>
                ) : null}
                <SortableCard
                  client={client}
                  index={index}
                  disabled={disabled || !onChange}
                  score={scoreLookup.get(key)}
                  showValues={showValues}
                  lastPos={lastPos}
                  worstCount={worstCount}
                />
              </li>
            );
          })}
        </ol>
      </SortableContext>
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: "0.35" } },
          }),
        }}
      >
        {activeClient ? (
          <CardFace
            client={activeClient}
            index={order.indexOf(activeClient.key)}
            dragging
            showValues={showValues}
            lastPos={lastPos}
            worstCount={worstCount}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableCard({
  client,
  index,
  disabled,
  score,
  showValues,
  lastPos,
  worstCount,
}: {
  client: Client;
  index: number;
  disabled: boolean;
  score?: CardScore;
  showValues: boolean;
  lastPos: number;
  worstCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: client.key, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-35" : undefined}>
      <CardFace
        client={client}
        index={index}
        disabled={disabled}
        score={score}
        showValues={showValues}
        lastPos={lastPos}
        worstCount={worstCount}
        handleProps={disabled ? undefined : { ...attributes, ...listeners }}
      />
    </div>
  );
}

function CardFace({
  client,
  index,
  disabled,
  dragging,
  score,
  showValues,
  lastPos,
  worstCount,
  handleProps,
}: {
  client: Client;
  index: number;
  disabled?: boolean;
  dragging?: boolean;
  score?: CardScore;
  showValues: boolean;
  lastPos: number;
  worstCount: number;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
  const pts = score?.points;
  const borderClass =
    pts === undefined
      ? "border-line"
      : pts >= 16
        ? "border-l-[var(--mint)]"
        : pts >= 8
          ? "border-l-[var(--gold)]"
          : "border-l-[var(--red)]";
  const bgClass = showValues
    ? client.profit < 0
      ? "bg-[var(--red-dim)]"
      : "bg-[var(--panel-2)]"
    : "bg-panel";
  const badgeClass =
    pts === undefined
      ? "text-muted"
      : pts >= 16
        ? "text-mint"
        : pts >= 8
          ? "text-gold"
          : "text-red";

  return (
    <div
      className={`flex min-h-[58px] items-start gap-3 rounded-[16px] border px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${bgClass} ${
        showValues ? `border-line border-l-4 ${borderClass}` : "border-line"
      } ${dragging ? "scale-[1.02]" : ""}`}
    >
      <span className="mt-0.5 flex h-9 min-w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-panel-2 px-1.5 text-center font-display text-[10px] font-semibold leading-tight text-paper">
        {labelFor(index, lastPos, worstCount)}
      </span>
      <ClientLogo
        key={`${client.key}-${client.name}`}
        clientKey={client.key}
        name={client.name}
        domain={client.domain}
        size={36}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-paper">{client.name}</p>
        {showValues ? (
          <RevealStats
            profit={client.profit}
            revenue={client.revenue}
            costoEquipo={client.costoEquipo}
          />
        ) : null}
        {score ? (
          <p className={`mt-1 text-xs ${badgeClass}`}>
            Tu puesto {posLabel(score.guessedPos, lastPos)} · real{" "}
            {posLabel(score.correctPos, lastPos)} · {score.points} pts
          </p>
        ) : handleProps && !showValues ? (
          <p className="text-xs text-muted">Arrastrá para ordenar</p>
        ) : null}
      </div>
      {score ? (
        <span className={`mt-0.5 font-display text-lg font-semibold ${badgeClass}`}>
          {score.points}
        </span>
      ) : handleProps ? (
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-xl text-muted active:text-paper"
          aria-label={`Mover ${client.name}`}
          {...handleProps}
        >
          <GripIcon />
        </button>
      ) : disabled ? null : null}
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <circle cx="6" cy="4" r="1.3" />
      <circle cx="12" cy="4" r="1.3" />
      <circle cx="6" cy="9" r="1.3" />
      <circle cx="12" cy="9" r="1.3" />
      <circle cx="6" cy="14" r="1.3" />
      <circle cx="12" cy="14" r="1.3" />
    </svg>
  );
}
