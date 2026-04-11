"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Block } from "@/features/document/model/types";
import { useColumnCount } from "@/features/document/hooks/useColumnCount";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DocumentRenderer } from "./DocumentRenderer";
import { SortableOutline } from "./dnd/SortableOutline";
import { exportPdfFromElement } from "./export/exportPdfFromElement";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type Props = {
  initialBlocks: Block[];
};

export function DocumentApp({ initialBlocks }: Props) {
  const hydrated = useRef(false);
  const seedBlocks = useRef(initialBlocks).current;
  const blocks = useDocumentStore((s) => s.blocks);
  const resolvedBlocks = blocks.length > 0 ? blocks : seedBlocks;
  const setBlocks = useDocumentStore((s) => s.setBlocks);
  const reorderBlocks = useDocumentStore((s) => s.reorderBlocks);
  const moveBlock = useDocumentStore((s) => s.moveBlock);
  const updateHeading = useDocumentStore((s) => s.updateHeading);
  const updateParagraph = useDocumentStore((s) => s.updateParagraph);
  const updateListItem = useDocumentStore((s) => s.updateListItem);

  const columnCount = useColumnCount();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  useLayoutEffect(() => {
    if (hydrated.current) return;
    setBlocks(initialBlocks);
    hydrated.current = true;
  }, [initialBlocks, setBlocks]);

  const handleExportPdf = async () => {
    const el = pdfRef.current;
    if (!el) return;
    setExporting(true);
    try {
      await exportPdfFromElement(el, "rfp-document.pdf");
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-muted/40 min-h-full flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row">
        <aside className="lg:w-80 lg:shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Outline</CardTitle>
              <CardDescription className="text-xs">
                Drag sections to reorder. Layout units recompute after each
                change.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <SortableOutline
                blocks={resolvedBlocks}
                onReorder={reorderBlocks}
                onMove={moveBlock}
              />
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Project scope
              </h1>
              <p className="text-muted-foreground text-sm">
                Click text to edit inline. Columns: {columnCount}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                type="button"
                onClick={handleExportPdf}
                disabled={exporting || resolvedBlocks.length === 0}
                title="Captures the rendered DOM for visual parity with the on-screen document."
              >
                {exporting ? "Exporting…" : "Export PDF"}
              </Button>
            </div>
          </div>

          <Separator />

          <div ref={pdfRef} className="space-y-8 bg-muted/40 p-2 sm:p-4">
            <DocumentRenderer
              blocks={resolvedBlocks}
              columnCount={columnCount}
              onUpdateHeading={updateHeading}
              onUpdateParagraph={updateParagraph}
              onUpdateListItem={updateListItem}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
