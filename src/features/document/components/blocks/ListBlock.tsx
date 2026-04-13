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
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import type { ListBlock as ListBlockType } from "@/features/document/model/types";
import { useDocumentStore } from "@/store/useDocumentStore";
import { EditableText } from "../editor/EditableText";
import { cn } from "@/lib/utils";

type ItemProps = {
  id: string;
  value: string;
  index: number;
  blockId: string;
  style: "ordered" | "unordered";
  onUpdateItem: (id: string, index: number, value: string) => void;
};

function SortableItem({ id, value, index, blockId, style, onUpdateItem }: ItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const cssStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={cssStyle}
      className={cn(
        "group/item relative flex items-start gap-1 rounded-md py-0.5 pr-1 transition-colors",
        isDragging ? "opacity-60 bg-foreground/5 rounded-md" : "hover:bg-foreground/4",
      )}
    >
      {/* Marker — number or bullet */}
      <span
        className={cn(
          "shrink-0 select-none text-muted-foreground/60 leading-relaxed",
          style === "ordered" ? "w-5 text-right text-sm" : "w-4 text-center text-base mt-[-1px]",
        )}
        aria-hidden="true"
      >
        {style === "ordered" ? `${index + 1}.` : "•"}
      </span>

      {/* Text */}
      <div className="flex-1 text-sm leading-relaxed text-foreground/75">
        <EditableText
          value={value}
          onCommit={(v) => onUpdateItem(blockId, index, v)}
          className="inline-block min-h-[1.25rem] w-full"
        />
      </div>

      {/* Drag handle — appears on hover */}
      <button
        type="button"
        className={cn(
          "shrink-0 mt-0.5 cursor-grab active:cursor-grabbing rounded p-0.5 transition-all duration-150",
          "text-muted-foreground/0 group-hover/item:text-muted-foreground/40 hover:!text-muted-foreground",
          isDragging && "text-muted-foreground/60",
        )}
        aria-label={`Drag to reorder item: ${value}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
    </li>
  );
}

type Props = {
  block: ListBlockType;
  onUpdateItem: (id: string, index: number, value: string) => void;
};

export function ListBlock({ block, onUpdateItem }: Props) {
  const reorderListItems = useDocumentStore((s) => s.reorderListItems);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Stable item IDs for dnd-kit (index-based since items are plain strings)
  const itemIds = block.items.map((_, i) => `${block.id}-item-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = itemIds.indexOf(String(active.id));
    const toIndex = itemIds.indexOf(String(over.id));
    if (fromIndex < 0 || toIndex < 0) return;
    reorderListItems(block.id, fromIndex, toIndex);
  };

  // Static fallback before mount (avoids SSR mismatch with dnd-kit)
  if (!mounted) {
    return (
      <ul className="mt-2 space-y-1">
        {block.items.map((item, i) => (
          <li key={`${block.id}-item-${i}`} className="flex items-start gap-1 py-0.5">
            <span className={cn(
              "shrink-0 select-none text-muted-foreground/60 leading-relaxed",
              block.style === "ordered" ? "w-5 text-right text-sm" : "w-4 text-center text-base",
            )}>
              {block.style === "ordered" ? `${i + 1}.` : "•"}
            </span>
            <span className="flex-1 text-sm leading-relaxed text-foreground/75">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="mt-2 space-y-0.5">
          {block.items.map((item, i) => (
            <SortableItem
              key={itemIds[i]}
              id={itemIds[i]}
              value={item}
              index={i}
              blockId={block.id}
              style={block.style}
              onUpdateItem={onUpdateItem}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
