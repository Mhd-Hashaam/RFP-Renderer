"use client";

import type { LayoutUnit as LayoutUnitType } from "@/features/document/model/types";
import { PAGE_CONTENT_HEIGHT_PX } from "@/features/document/model/constants";
import { Column } from "./Column";
import { cn } from "@/lib/utils";

type Props = {
  pageIndex: number;
  totalPages: number;
  columns: LayoutUnitType[][];
  columnCount: number;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function Page({
  pageIndex,
  totalPages,
  columns,
  columnCount,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl",
        "border border-white/10",
        "bg-white/[0.06] backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "transition-shadow duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]",
        "dark:bg-white/[0.06]",
        "light:bg-black/[0.04]",
      )}
    >
      {/* Columns grid */}
      <div
        data-page-grid
        className={cn(
          "grid divide-x divide-white/5",
          columnCount === 1 && "grid-cols-1",
          columnCount === 2 && "grid-cols-1 md:grid-cols-2",
          columnCount === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
        style={{ minHeight: PAGE_CONTENT_HEIGHT_PX }}
      >
        {columns.map((units, idx) => (
          <Column
            key={`col-${pageIndex}-${idx}`}
            units={units}
            onUpdateHeading={onUpdateHeading}
            onUpdateParagraph={onUpdateParagraph}
            onUpdateListItem={onUpdateListItem}
            className="p-6"
          />
        ))}
      </div>

      {/* Page footer */}
      <div className="flex items-center justify-center border-t border-white/5 px-6 py-2.5">
        <span className="text-[10px] font-medium tracking-widest text-white/20 uppercase">
          — Page {pageIndex + 1} of {totalPages} —
        </span>
      </div>
    </div>
  );
}
