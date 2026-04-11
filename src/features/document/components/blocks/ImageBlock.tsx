"use client";

import Image from "next/image";
import type { ImageBlock as ImageBlockType } from "@/features/document/model/types";

type Props = {
  block: ImageBlockType;
};

export function ImageBlock({ block }: Props) {
  return (
    <figure className="mt-4 space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
        <Image
          src={block.src}
          alt={block.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 900px"
          priority={false}
        />
      </div>
      {block.caption ? (
        <figcaption className="text-muted-foreground text-xs">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
