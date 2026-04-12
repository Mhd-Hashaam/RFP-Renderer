"use client";

import { useMemo } from "react";
import { runPipeline } from "@/features/document/intelligence/pipeline";
import { SECTION_PAGE_CONTENT_HEIGHT_PX } from "@/features/document/model/constants";
import type { Block, DeviceCapability } from "@/features/document/model/types";
import { Page } from "./Page";

type Props = {
  blocks: Block[];
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

/**
 * Runs the semantic layout pipeline and renders the resulting pages.
 * Each page is a card containing one or more classified sections.
 */
export function DocumentRenderer({
  blocks,
  device,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  const pages = useMemo(
    () => runPipeline(blocks, SECTION_PAGE_CONTENT_HEIGHT_PX),
    [blocks],
  );

  return (
    <div className="flex flex-col gap-8">
      {pages.map((page, idx) => (
        <Page
          key={`page-${idx}`}
          pageIndex={idx}
          totalPages={pages.length}
          sections={page.sections}
          device={device}
          onUpdateHeading={onUpdateHeading}
          onUpdateParagraph={onUpdateParagraph}
          onUpdateListItem={onUpdateListItem}
        />
      ))}
    </div>
  );
}
