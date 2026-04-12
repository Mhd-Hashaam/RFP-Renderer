"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Block } from "@/features/document/model/types";
import { useColumnCount } from "@/features/document/hooks/useColumnCount";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentRenderer } from "./DocumentRenderer";
import { DocumentOutline } from "./sidebar/DocumentOutline";
import { SortableOutline } from "./dnd/SortableOutline";
import { exportPdfFromElement } from "./export/exportPdfFromElement";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { runPipeline } from "@/features/document/intelligence/pipeline";
import { SECTION_PAGE_CONTENT_HEIGHT_PX } from "@/features/document/model/constants";
import {
  Download,
  FileText,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const device = useColumnCount();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reorderOpen, setReorderOpen] = useState(false);

  // Derive sections for DocumentOutline — same pipeline, memoized
  const sections = useMemo(
    () => runPipeline(resolvedBlocks, SECTION_PAGE_CONTENT_HEIGHT_PX).flatMap((p) => p.sections),
    [resolvedBlocks],
  );

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
    <div className="flex h-screen w-screen overflow-hidden dark:bg-[#0a0a0a]">

      {/* ── Fixed Sidebar ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "relative flex h-full flex-col border-r border-white/10",
          "bg-black/40 backdrop-blur-2xl",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64 min-w-[16rem]" : "w-0 min-w-0 overflow-hidden border-r-0",
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-white/10">
            <FileText className="size-3.5 text-white/80" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-heading text-sm font-semibold text-white/90">
              RFP Renderer
            </div>
            <div className="truncate text-[10px] text-white/40">Gothic Architecture</div>
          </div>
        </div>

        {/* Outline label */}
        <div className="px-5 pb-2 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Document Outline
          </span>
        </div>

        {/* Document outline — section headings only */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-2 pb-4">
          <DocumentOutline sections={sections} />
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-white/10 px-5 py-3">
          <div className="text-[10px] text-white/30">
            {sections.length} sections · {device}
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top toolbar */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/20 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="cursor-pointer rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <LayoutGrid className="size-3.5" />
              <span>RFP Editor</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reorder mode toggle */}
            <button
              type="button"
              onClick={() => setReorderOpen((v) => !v)}
              className={cn(
                "cursor-pointer rounded-md p-1.5 text-xs transition-colors",
                reorderOpen
                  ? "bg-white/15 text-white/90"
                  : "text-white/50 hover:bg-white/10 hover:text-white/90",
              )}
              aria-label="Toggle reorder mode"
              title="Reorder sections"
            >
              <GripVertical className="size-4" />
            </button>
            <ThemeToggle />
            <Button
              type="button"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || resolvedBlocks.length === 0}
              className="cursor-pointer gap-1.5 border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm transition-all duration-150 hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]"
            >
              <Download className="size-3.5" />
              {exporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </header>

        {/* Document scroll area */}
        <main className="flex-1 overflow-y-auto">
          <div ref={pdfRef} className="mx-auto max-w-5xl space-y-8 px-6 py-8">
            <DocumentRenderer
              blocks={resolvedBlocks}
              device={device}
              onUpdateHeading={updateHeading}
              onUpdateParagraph={updateParagraph}
              onUpdateListItem={updateListItem}
            />
          </div>
        </main>
      </div>

      {/* ── Reorder drawer (slide-over) ────────────────────────────── */}
      {reorderOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setReorderOpen(false)}
          />
          {/* Panel */}
          <aside className="relative z-10 flex h-full w-80 flex-col border-l border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-sm font-semibold text-white/80">Reorder Sections</span>
              <button
                type="button"
                onClick={() => setReorderOpen(false)}
                className="cursor-pointer rounded-md p-1 text-white/50 hover:text-white/90"
                aria-label="Close reorder panel"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SortableOutline
                blocks={resolvedBlocks}
                onReorder={reorderBlocks}
                onMove={moveBlock}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
