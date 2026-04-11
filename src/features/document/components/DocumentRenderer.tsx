"use client";

import { useMemo } from "react";
import { buildLayoutUnits } from "@/features/document/layout/buildLayoutUnits";
import { paginate } from "@/features/document/layout/paginate";
import { PAGE_CONTENT_HEIGHT_PX } from "@/features/document/model/constants";
import type { Block } from "@/features/document/model/types";
import { Page } from "./Page";

type Props = {
  blocks: Block[];
  columnCount: number;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function DocumentRenderer({
  blocks,
  columnCount,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  const pages = useMemo(() => {
    const units = buildLayoutUnits(blocks);
    return paginate(units, columnCount, PAGE_CONTENT_HEIGHT_PX);
  }, [blocks, columnCount]);

  return (
    <div className="flex flex-col gap-8">
      {pages.map((page, idx) => (
        <Page
          key={`page-${idx}`}
          pageIndex={idx}
          columns={page.columns}
          columnCount={columnCount}
          onUpdateHeading={onUpdateHeading}
          onUpdateParagraph={onUpdateParagraph}
          onUpdateListItem={onUpdateListItem}
        />
      ))}
    </div>
  );
}
