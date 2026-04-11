"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Block } from "@/features/document/model/types";
import { useColumnCount } from "@/features/document/hooks/useColumnCount";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DocumentRenderer } from "./DocumentRenderer";
import { SortableOutline } from "./dnd/SortableOutline";
import { exportPdfFromElement } from "./export/exportPdfFromElement";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Download, FileText, Columns3 } from "lucide-react";

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
    <div className="bg-background min-h-full flex-1">
      {/* Top toolbar */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="size-3.5" />
            </div>
            <span className="font-heading text-sm font-semibold tracking-tight">
              RFP Renderer
            </span>
          </div>

          {/* Meta */}
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Columns3 className="size-3.5" />
            <span>{columnCount} column{columnCount !== 1 ? "s" : ""}</span>
            <span className="mx-1 opacity-30">·</span>
            <span>{resolvedBlocks.length} blocks</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || resolvedBlocks.length === 0}
              className="cursor-pointer gap-1.5"
              title="Captures the rendered DOM for visual parity with the on-screen document."
            >
              <Download className="size-3.5" />
              {exporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0">
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-heading text-sm font-semibold">
                Document Outline
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Drag to reorder sections. Layout recomputes automatically.
              </CardDescription>
            </CardHeader>
            <Separator className="mb-3 opacity-50" />
            <CardContent className="px-3 pb-4 pt-0">
              <SortableOutline
                blocks={resolvedBlocks}
                onReorder={reorderBlocks}
                onMove={moveBlock}
              />
            </CardContent>
          </Card>
        </aside>

        {/* Document area */}
        <main className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Click any text to edit inline
            </p>
          </div>
          <div ref={pdfRef} className="space-y-6">
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
