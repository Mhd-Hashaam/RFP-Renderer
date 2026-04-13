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
import type { Block, Section } from "@/features/document/model/types";
import { groupIntoSections } from "@/features/document/intelligence/groupIntoSections";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

/** Returns a short summary of what's inside a section */
function sectionMeta(section: Section): { label: string; icons: string[] } {
  const icons: string[] = [];
  let imageCount = 0;
  let paraCount = 0;
  let listCount = 0;

  for (const block of section.content) {
    if (block.type === "image") imageCount++;
    else if (block.type === "paragraph") paraCount++;
    else if (block.type === "list") listCount++;
  }

  if (imageCount) icons.push(`${imageCount} image${imageCount > 1 ? "s" : ""}`);
  if (paraCount) icons.push(`${paraCount} para${paraCount > 1 ? "s" : ""}`);
  if (listCount) icons.push(`${listCount} list${listCount > 1 ? "s" : ""}`);

  const label = section.heading?.content ?? "Untitled section";
  return { label, icons };
}

function SortableSection({
  section,
  index,
}: {
  section: Section;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { label, icons } = sectionMeta(section);
  const isH1 = section.heading?.level === 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150",
        "border border-border bg-card",
        isDragging
          ? "shadow-xl ring-2 ring-foreground/20 opacity-90 scale-[1.02] z-50"
          : "hover:border-foreground/20 hover:bg-accent",
      )}
    >
      {/* Index badge */}
      <span className="shrink-0 flex size-6 items-center justify-center rounded-md bg-foreground/8 text-[10px] font-semibold text-muted-foreground tabular-nums">
        {index + 1}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className={cn(
          "truncate text-sm text-foreground",
          isH1 ? "font-semibold" : "font-medium",
        )}>
          {label}
        </div>
        {icons.length > 0 && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {icons.join(" · ")}
          </div>
        )}
      </div>

      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          "shrink-0 cursor-grab active:cursor-grabbing rounded-md p-1.5 transition-colors",
          "text-muted-foreground/40 hover:text-muted-foreground hover:bg-foreground/5",
        )}
        aria-label={`Drag to reorder: ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
    </div>
  );
}

type Props = {
  blocks: Block[];
  onReorder: (activeSectionId: string, overSectionId: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

export function SortableOutline({ blocks, onReorder }: Props) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const sections = useMemo(() => groupIntoSections(blocks), [blocks]);
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);

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
      <div className="space-y-2 p-1">
        {sections.map((section, i) => {
          const { label, icons } = sectionMeta(section);
          return (
            <div
              key={section.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
            >
              <span className="shrink-0 flex size-6 items-center justify-center rounded-md bg-foreground/8 text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{label}</div>
                {icons.length > 0 && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{icons.join(" · ")}</div>
                )}
              </div>
              <GripVertical className="size-4 shrink-0 text-muted-foreground/30" />
            </div>
          );
        })}
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
        <div className="space-y-2 p-1">
          {sections.map((section, i) => (
            <SortableSection
              key={section.id}
              section={section}
              index={i}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
