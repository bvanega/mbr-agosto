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
import { formatUsd, type Client } from "@/lib/data";
import { scoreTone, type CardScore } from "@/lib/scoring";

function positionLabel(index: number) {
  if (index === 5) return "Último";
  return `${index + 1}º`;
}

type RankListProps = {
  clients: Client[];
  order: string[];
  onChange?: (order: string[]) => void;
  disabled?: boolean;
  scores?: CardScore[];
  showValues?: boolean;
};

export function RankList({
  clients,
  order,
  onChange,
  disabled = false,
  scores,
  showValues = false,
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
                    Último lugar
                  </p>
                ) : null}
                <SortableCard
                  client={client}
                  index={index}
                  disabled={disabled || !onChange}
                  score={scoreLookup.get(key)}
                  showValues={showValues}
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
}: {
  client: Client;
  index: number;
  disabled: boolean;
  score?: CardScore;
  showValues: boolean;
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
  handleProps,
}: {
  client: Client;
  index: number;
  disabled?: boolean;
  dragging?: boolean;
  score?: CardScore;
  showValues: boolean;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
}) {
  const tone = score ? scoreTone(score.points) : null;
  const toneClass =
    tone === "mint"
      ? "border-mint/70 bg-mint/10"
      : tone === "gold"
        ? "border-gold/70 bg-gold/10"
        : tone === "red"
          ? "border-red/60 bg-red/10"
          : "border-line bg-panel";

  const badgeClass =
    tone === "mint"
      ? "text-mint"
      : tone === "gold"
        ? "text-gold"
        : tone === "red"
          ? "text-red"
          : "text-muted";

  return (
    <div
      className={`flex min-h-[58px] items-center gap-3 rounded-[16px] border px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${toneClass} ${
        dragging ? "scale-[1.02]" : ""
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel-2 font-display text-sm font-semibold text-paper">
        {positionLabel(index)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-paper">{client.name}</p>
        {score ? (
          <p className={`text-xs ${badgeClass}`}>
            Tu puesto {score.guessedPos === 11 ? "último" : `${score.guessedPos}º`} · real{" "}
            {score.correctPos === 11 ? "último" : `${score.correctPos}º`} · {score.points} pts
            {showValues ? ` · ${formatUsd(score.value)}` : ""}
          </p>
        ) : showValues ? (
          <p className="text-xs text-muted">{formatUsd(client.value)}</p>
        ) : handleProps ? (
          <p className="text-xs text-muted">Arrastrá para ordenar</p>
        ) : null}
      </div>
      {score ? (
        <span className={`font-display text-lg font-semibold ${badgeClass}`}>
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
