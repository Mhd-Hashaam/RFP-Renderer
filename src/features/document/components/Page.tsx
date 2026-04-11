"use client";

import type { LayoutUnit as LayoutUnitType } from "@/features/document/model/types";
import { PAGE_CONTENT_HEIGHT_PX } from "@/features/document/model/constants";
import { Column } from "./Column";
import { cn } from "@/lib/utils";

type Props = {
  pageIndex: number;
  columns: LayoutUnitType[][];
  columnCount: number;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function Page({
  pageIndex,
  columns,
  columnCount,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Page header bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-5 py-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Page {pageIndex + 1}
        </span>
        <span className="hidden text-[11px] text-muted-foreground/40 sm:inline">
          RFP Preview
        </span>
      </div>

      {/* Columns grid */}
      <div
        data-page-grid
        className={cn(
          "grid gap-px bg-border/20",
          columnCount === 1 && "grid-cols-1",
          columnCount === 2 && "grid-cols-1 md:grid-cols-2",
          columnCount === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
        style={{ minHeight: PAGE_CONTENT_HEIGHT_PX }}
      >
        {columns.map((units, idx) => (
          <div key={`col-${pageIndex}-${idx}`} className="bg-card">
            <Column
              units={units}
              onUpdateHeading={onUpdateHeading}
              onUpdateParagraph={onUpdateParagraph}
              onUpdateListItem={onUpdateListItem}
              className="p-5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
