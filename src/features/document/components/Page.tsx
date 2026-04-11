"use client";

import type { LayoutUnit as LayoutUnitType } from "@/features/document/model/types";
import { PAGE_CONTENT_HEIGHT_PX } from "@/features/document/model/constants";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="text-muted-foreground flex items-center justify-between border-b px-4 py-2 text-xs">
          <span>Page {pageIndex + 1}</span>
          <span className="hidden sm:inline">RFP preview</span>
        </div>
        <div
          className={cn(
            "grid gap-6 p-4 sm:p-6",
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
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
