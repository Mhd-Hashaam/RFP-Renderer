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
import { useMemo } from "react";
import type { Block } from "@/features/document/model/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

function previewBlock(block: Block): string {
  switch (block.type) {
    case "heading":
      return block.content || "Heading";
    case "paragraph":
      return block.content.slice(0, 72) || "Paragraph";
    case "list":
      return `List (${block.items.length})`;
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
        "bg-background flex items-center gap-2 rounded-md border px-2 py-1.5",
        isDragging && "opacity-60 shadow-sm",
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground touch-manipulation rounded-sm p-1"
        aria-label={`Drag to reorder: ${previewBlock(block)}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
          {block.type}
        </div>
        <div className="truncate text-sm">{previewBlock(block)}</div>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 sm:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Move section up"
          onClick={() => onMove(block.id, "up")}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Move section down"
          onClick={() => onMove(block.id, "down")}
        >
          <ChevronDown className="size-4" />
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.map((block) => (
            <SortableRow key={block.id} block={block} onMove={onMove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
