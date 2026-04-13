"use client";

import Image from "next/image";
import { EditableText } from "../editor/EditableText";
import { BlockRenderer } from "../BlockRenderer";
import type { ClassifiedSection, DeviceCapability, ImageBlock } from "@/features/document/model/types";
import { cn } from "@/lib/utils";

type Props = {
  section: ClassifiedSection;
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function HeroSection({
  section,
  device,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  const heroImage = section.content.find((b): b is ImageBlock => b.type === "image");
  const nonImageBlocks = section.content.filter((b) => b.type !== "image");
  const isDesktop = device === "desktop" || device === "tablet";

  return (
    <section
      data-section-id={section.id}
      className="mb-20 pt-6"
    >
      <div
        className={cn(
          isDesktop && heroImage ? "grid grid-cols-5 gap-10 items-start" : "flex flex-col gap-8",
        )}
      >
        {/* Text column — 3 of 5 cols on desktop */}
        <div className={cn(isDesktop && heroImage ? "col-span-3" : "w-full")}>
          {section.heading && (
            <h1 className="mb-6 font-heading text-5xl font-bold tracking-[-0.02em] leading-tight text-foreground lg:text-6xl">
              <EditableText
                value={section.heading.content}
                onCommit={(v) => onUpdateHeading(section.heading!.id, v)}
                className="inline-block w-full"
              />
            </h1>
          )}

          <div className="space-y-5 max-w-[60ch]">
            {nonImageBlocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                onUpdateHeading={onUpdateHeading}
                onUpdateParagraph={onUpdateParagraph}
                onUpdateListItem={onUpdateListItem}
              />
            ))}
          </div>
        </div>

        {/* Hero image — 2 of 5 cols, editorial offset */}
        {heroImage && (
          <figure className={cn(isDesktop ? "col-span-2 translate-x-2" : "w-full", "space-y-2")}>
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={800}
                height={1200}
                className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>
            {heroImage.caption && (
              <figcaption className="text-muted-foreground text-xs italic px-0.5">
                {heroImage.caption}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  );
}
