"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useEffect, useState } from "react";
import type { Block } from "@/features/document/model/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

function previewBlock(block: Block): string {
  switch (block.type) {
    case "heading":
      return block.content || "Heading";
    case "paragraph":
      return block.content.slice(0, 60) || "Paragraph";
    case "list":
      return `List (${block.items.length} items)`;
    case "image":
      return block.alt || "Image";
    case "group":
      return "Group";
    default: {
      const _never: never = block;
      return _never;
    }
  }
}

const typeColor: Record<Block["type"], string> = {
  heading: "bg-violet-500/15 text-violet-400",
  paragraph: "bg-sky-500/15 text-sky-400",
  list: "bg-emerald-500/15 text-emerald-400",
  image: "bg-amber-500/15 text-amber-400",
  group: "bg-rose-500/15 text-rose-400",
};

function SortableRow({
  block,
  onMove,
}: {
  block: Block;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/row bg-card flex items-center gap-2 rounded-lg border px-2 py-2 transition-shadow duration-150",
        isDragging
          ? "shadow-lg ring-1 ring-ring/30 opacity-80"
          : "hover:shadow-sm hover:border-border/80",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-manipulation rounded-sm p-1 transition-colors"
        aria-label={`Drag to reorder: ${previewBlock(block)}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "mb-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
            typeColor[block.type],
          )}
        >
          {block.type}
        </span>
        <div className="truncate text-xs font-medium text-foreground/80">
          {previewBlock(block)}
        </div>
      </div>

      {/* Mobile up/down */}
      <div className="flex shrink-0 flex-col gap-0.5 sm:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 cursor-pointer"
          aria-label="Move section up"
          onClick={() => onMove(block.id, "up")}
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 cursor-pointer"
          aria-label="Move section down"
          onClick={() => onMove(block.id, "down")}
        >
          <ChevronDown className="size-3" />
        </Button>
      </div>
    </div>
  );
}

type Props = {
  blocks: Block[];
  onReorder: (activeId: string, overId: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

export function SortableOutline({ blocks, onReorder, onMove }: Props) {
  // Mount guard — prevents @dnd-kit aria-describedby SSR/client mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ids = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  if (!mounted) {
    return (
      <div className="space-y-2">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="bg-card flex items-center gap-2 rounded-lg border px-2 py-2"
          >
            <div className="text-muted-foreground/40 p-1">
              <GripVertical className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "mb-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                  typeColor[block.type],
                )}
              >
                {block.type}
              </span>
              <div className="truncate text-xs font-medium text-foreground/80">
                {previewBlock(block)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {blocks.map((block) => (
            <SortableRow key={block.id} block={block} onMove={onMove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
