"use client";

import type { ClassifiedSection, DeviceCapability } from "@/features/document/model/types";
import { SectionRenderer } from "./sections/SectionRenderer";

type Props = {
  pageIndex: number;
  totalPages: number;
  sections: ClassifiedSection[];
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

/**
 * A page card containing one or more classified sections.
 * Applies Vercel-style dark card styling.
 */
export function Page({
  pageIndex,
  totalPages,
  sections,
  device,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  return (
    <article
      data-page-card
      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
    >
      {/* Page content */}
      <div className="p-8 md:p-10">
        {sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            device={device}
            onUpdateHeading={onUpdateHeading}
            onUpdateParagraph={onUpdateParagraph}
            onUpdateListItem={onUpdateListItem}
          />
        ))}
      </div>

      {/* Page footer */}
      <div className="flex items-center justify-center border-t border-zinc-800 px-8 py-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
          — Page {pageIndex + 1} of {totalPages} —
        </span>
      </div>
    </article>
  );
}
