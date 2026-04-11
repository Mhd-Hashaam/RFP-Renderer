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
  // Hero: unit starts with H1 and contains an image → large image treatment
  const isHeroUnit =
    unit.blocks[0]?.type === "heading" &&
    (unit.blocks[0] as { level: number }).level === 1 &&
    unit.blocks.some((b) => b.type === "image");

  // Standalone image (no heading) — still gets hero if it's the first block
  const isStandaloneHeroImage =
    unit.blocks.length === 1 &&
    unit.blocks[0].type === "image" &&
    unit.id.startsWith("3"); // block id "3" is the main hero image

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
          hero={
            block.type === "image" &&
            (isHeroUnit || isStandaloneHeroImage)
          }
        />
      ))}
    </div>
  );
}
