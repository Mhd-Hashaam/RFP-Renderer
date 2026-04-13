"use client";

import { useEffect, useRef, useState } from "react";
import type { ClassifiedSection } from "@/features/document/model/types";
import { cn } from "@/lib/utils";

type Props = {
  sections: ClassifiedSection[];
};

/**
 * Document Outline sidebar.
 *
 * - Renders one entry per section with a non-null heading.
 * - Uses IntersectionObserver to track the active section.
 * - Click scrolls the target section into view smoothly.
 * - No block-type badges, no block-count labels.
 */
export function DocumentOutline({ sections }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const headingSections = sections.filter((s) => s.heading !== null);

  useEffect(() => {
    if (headingSections.length === 0) return;

    // Disconnect previous observer
    observerRef.current?.disconnect();

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Find the topmost visible section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        const id = visible[0].target.getAttribute("data-section-id");
        if (id) setActiveId(id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "-10% 0px -60% 0px",
      threshold: 0,
    });

    // Observe all section elements
    for (const section of headingSections) {
      const el = document.querySelector(`[data-section-id="${section.id}"]`);
      if (el) observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.querySelector(`[data-section-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (headingSections.length === 0) {
    return (
      <p className="text-muted-foreground/50 text-xs px-3 py-2">No headings</p>
    );
  }

  return (
    <nav aria-label="Document outline" className="overflow-y-auto scrollbar-none">
      <ul className="space-y-0.5">
        {headingSections.map((section) => {
          const isActive = activeId === section.id;
          const isH1 = section.heading?.level === 1;

          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-all duration-150",
                  isH1 ? "font-semibold" : "font-normal",
                  isActive
                    ? "border-l-2 border-foreground/60 bg-foreground/5 pl-2.5 text-foreground"
                    : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                {section.heading!.content}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
