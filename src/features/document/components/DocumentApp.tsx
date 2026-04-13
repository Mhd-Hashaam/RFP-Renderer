"use client";

import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  X,
  Loader2,
  Undo2,
  Redo2,
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
  const reorderSections = useDocumentStore((s) => s.reorderSections);
  const moveBlock = useDocumentStore((s) => s.moveBlock);
  const updateHeading = useDocumentStore((s) => s.updateHeading);
  const updateParagraph = useDocumentStore((s) => s.updateParagraph);
  const updateListItem = useDocumentStore((s) => s.updateListItem);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);

  const device = useColumnCount();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);

  // Open sidebar by default on desktop (≥1024px), closed on mobile/tablet
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
    setExportError(null);
    try {
      await exportPdfFromElement(el, "rfp-document.pdf");
    } catch (error) {
      console.error(error);
      setExportError("PDF export failed. Please try again.");
      // Auto-dismiss after 5 seconds
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      {/* ── Mobile/tablet overlay backdrop ───────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex h-full flex-col",
          "border-r border-border",
          "bg-card dark:bg-black/40 dark:backdrop-blur-2xl",
          "transition-all duration-300 ease-in-out",
          "lg:relative lg:z-auto",
          "max-lg:fixed max-lg:z-30 max-lg:top-0 max-lg:left-0 max-lg:h-full",
          sidebarOpen
            ? "w-64 min-w-[16rem]"
            : "w-0 min-w-0 overflow-hidden border-r-0",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground/10">
              <FileText className="size-3.5 text-foreground/80" />
            </div>
            <span className="truncate font-heading text-sm font-semibold text-foreground">
              RFP Renderer
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="shrink-0 cursor-pointer rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        {/* Outline label */}
        <div className="px-5 pb-2 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Document Outline
          </span>
        </div>

        {/* Document outline */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto scroll-smooth px-2 pb-4 [scrollbar-width:thin] [scrollbar-color:var(--scrollbar-thumb)_transparent]"
        >
          <DocumentOutline sections={sections} />
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-3">
          {/* Export error message */}
          {exportError && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-400">
              <span>{exportError}</span>
              <button
                type="button"
                onClick={() => setExportError(null)}
                className="ml-2 cursor-pointer text-rose-400/60 hover:text-rose-400"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex justify-center items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || resolvedBlocks.length === 0}
              className="cursor-pointer gap-2 border border-border bg-foreground/5 px-3 py-2 text-sm text-foreground/90 transition-all duration-150 hover:scale-[1.02] hover:bg-foreground/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {exporting ? "Exporting…" : "Export PDF"}
            </Button>

            <button
              type="button"
              onClick={() => setReorderOpen((v) => !v)}
              className={cn(
                "cursor-pointer rounded-md p-2 transition-all duration-150",
                reorderOpen
                  ? "bg-foreground/15 text-foreground/90"
                  : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground/90",
              )}
              aria-label="Toggle reorder mode"
              title="Reorder sections"
            >
              <GripVertical className="size-4" />
            </button>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 flex justify-center">
            <ThemeToggle />
          </div>
          <div className="text-center text-[10px] text-muted-foreground">
            {sections.length} sections · {device}
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top toolbar */}
        <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border bg-card dark:bg-black/40 dark:backdrop-blur-2xl px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "cursor-pointer rounded-md p-1.5 text-foreground/50 transition-all duration-200 hover:bg-foreground/10 hover:text-foreground/90",
              sidebarOpen ? "pointer-events-none opacity-0" : "opacity-100",
            )}
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>

          <Separator orientation="vertical" className="h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-foreground/70">
            <LayoutGrid className="size-3.5" />
            <span>RFP Editor</span>
          </div>

          {/* Undo / Redo — only appear after an edit has been made */}
          <div className={cn(
            "group/history ml-auto flex items-center gap-0.5 transition-all duration-200",
            (canUndo || canRedo) ? "opacity-100" : "pointer-events-none opacity-0",
          )}>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              className={cn(
                "cursor-pointer rounded-md p-1.5 transition-all duration-150",
                "text-foreground/40 hover:text-foreground/80 hover:bg-foreground/8",
                "disabled:pointer-events-none disabled:opacity-30",
              )}
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
              className={cn(
                "cursor-pointer rounded-md p-1.5 transition-all duration-150",
                "text-foreground/40 hover:text-foreground/80 hover:bg-foreground/8",
                "disabled:pointer-events-none disabled:opacity-30",
              )}
            >
              <Redo2 className="size-3.5" />
            </button>
          </div>
        </header>

        {/* Document scroll area */}
        <main
          id="lenis-scroll-container"
          className="flex-1 overflow-y-auto scroll-smooth overscroll-y-auto [scrollbar-width:thin] [scrollbar-color:var(--scrollbar-thumb)_transparent]"
        >
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

      {/* ── Reorder drawer ────────────────────────────────────────── */}
      {reorderOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setReorderOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-80 flex-col border-l border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-sm font-semibold text-foreground/80">Reorder Sections</span>
              <button
                type="button"
                onClick={() => setReorderOpen(false)}
                className="cursor-pointer rounded-md p-1 text-foreground/50 hover:text-foreground/90"
                aria-label="Close reorder panel"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:var(--scrollbar-thumb)_transparent]">
              <SortableOutline
                blocks={resolvedBlocks}
                onReorder={reorderSections}
                onMove={moveBlock}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
