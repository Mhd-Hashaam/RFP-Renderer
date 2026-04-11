"use client";

import type { LayoutUnit as LayoutUnitType } from "@/features/document/model/types";
import { LayoutUnit } from "./LayoutUnit";
import { cn } from "@/lib/utils";

type Props = {
  units: LayoutUnitType[];
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
  className?: string;
};

export function Column({
  units,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
  className,
}: Props) {
  return (
    <div className={cn("flex min-h-0 flex-col gap-4", className)}>
      {units.map((unit) => (
        <LayoutUnit
          key={unit.id}
          unit={unit}
          onUpdateHeading={onUpdateHeading}
          onUpdateParagraph={onUpdateParagraph}
          onUpdateListItem={onUpdateListItem}
        />
      ))}
    </div>
  );
}
