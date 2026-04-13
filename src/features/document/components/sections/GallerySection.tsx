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

export function GallerySection({
  section,
  device,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  const images = section.content.filter((b): b is ImageBlock => b.type === "image");
  const nonImageBlocks = section.content.filter((b) => b.type !== "image");
  const isMobile = device === "mobile";

  return (
    <section
      data-section-id={section.id}
      className="mb-16"
    >
      {/* Heading full-width */}
      {section.heading && (
        <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight text-foreground">
          <EditableText
            value={section.heading.content}
            onCommit={(v) => onUpdateHeading(section.heading!.id, v)}
            className="inline-block w-full"
          />
        </h2>
      )}

      {/* Non-image content */}
      {nonImageBlocks.length > 0 && (
        <div className="mb-6 space-y-3">
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
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className={cn(buildGridClass(images.length, isMobile), "gap-3")}>
          {images.map((img, idx) => (
            <figure
              key={img.id}
              className={cn(
                "space-y-1.5",
                images.length === 3 && idx === 0 && !isMobile ? "col-span-2" : "",
              )}
            >
              <div className="relative w-full overflow-hidden rounded-lg border border-white/10 shadow-md">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={800}
                  height={600}
                  className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
              {img.caption && (
                <figcaption className="text-muted-foreground text-xs italic px-0.5">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

function buildGridClass(imageCount: number, isMobile: boolean): string {
  if (isMobile || imageCount === 1) return "grid grid-cols-1";
  if (imageCount === 2) return "grid grid-cols-2";
  // 3 images: first spans 2 cols, next two in 1 col each → grid-cols-2
  if (imageCount === 3) return "grid grid-cols-2";
  // 4+ images: uniform 2-col grid
  return "grid grid-cols-2";
}
