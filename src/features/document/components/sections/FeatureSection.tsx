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

export function FeatureSection({
  section,
  device,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  const featureImage = section.content.find((b): b is ImageBlock => b.type === "image");
  const nonImageBlocks = section.content.filter((b) => b.type !== "image");
  const isDesktop = device === "desktop" || device === "tablet";

  // Alternate layout direction based on featureIndex
  // Even → image left, text right; Odd → text left, image right
  const imageLeft = section.featureIndex % 2 === 0;

  const textCol = (
    <div className="flex flex-col justify-center gap-4">
      {section.heading && (
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-zinc-100">
          <EditableText
            value={section.heading.content}
            onCommit={(v) => onUpdateHeading(section.heading!.id, v)}
            className="inline-block w-full"
          />
        </h2>
      )}
      <div className="space-y-3">
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
  );

  const imageCol = featureImage ? (
    <figure className="space-y-2">
      <div
        className="relative w-full overflow-hidden rounded-lg border border-white/10 shadow-lg"
        style={{ aspectRatio: "16/9" }}
      >
        <Image
          src={featureImage.src}
          alt={featureImage.alt}
          fill
          className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
      {featureImage.caption && (
        <figcaption className="text-zinc-500 text-xs italic px-0.5">
          {featureImage.caption}
        </figcaption>
      )}
    </figure>
  ) : null;

  return (
    <section
      data-section-id={section.id}
      className="mb-16"
    >
      {isDesktop && featureImage ? (
        <div className="grid grid-cols-2 gap-8 items-center">
          {imageLeft ? (
            <>
              {imageCol}
              {textCol}
            </>
          ) : (
            <>
              {textCol}
              {imageCol}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {imageCol}
          {textCol}
        </div>
      )}
    </section>
  );
}
