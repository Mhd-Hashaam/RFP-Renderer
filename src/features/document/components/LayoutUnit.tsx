"use client";

import type { LayoutUnit as LayoutUnitType } from "@/features/document/model/types";
import { BlockRenderer } from "./BlockRenderer";
import { cn } from "@/lib/utils";

type Props = {
  unit: LayoutUnitType;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function LayoutUnit({
  unit,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  return (
    <div
      className={cn(
        "space-y-1",
        "[break-inside:avoid] [page-break-inside:avoid]",
      )}
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      {unit.blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          onUpdateHeading={onUpdateHeading}
          onUpdateParagraph={onUpdateParagraph}
          onUpdateListItem={onUpdateListItem}
        />
      ))}
    </div>
  );
}
