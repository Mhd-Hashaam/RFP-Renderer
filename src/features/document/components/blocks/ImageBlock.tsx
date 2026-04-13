"use client";

import Image from "next/image";
import type { ImageBlock as ImageBlockType } from "@/features/document/model/types";

type Props = {
  block: ImageBlockType;
  /** When true, renders as a large hero image */
  hero?: boolean;
};

export function ImageBlock({ block, hero = false }: Props) {
  return (
    <figure className="mt-3 space-y-1.5">
      <div
        className={
          hero
            ? "relative w-full overflow-hidden rounded-xl border border-white/10 shadow-lg"
            : "relative w-full overflow-hidden rounded-lg border border-white/10"
        }
      >
        <Image
          src={block.src}
          alt={block.alt}
          width={800}
          height={600}
          className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={hero}
          unoptimized
        />
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
      {block.caption && (
        <figcaption className="text-[11px] text-white/40 italic px-0.5">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
