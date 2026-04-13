"use client";

import type { HeadingBlock as HeadingBlockType } from "@/features/document/model/types";
import { EditableText } from "../editor/EditableText";
import { cn } from "@/lib/utils";

type Props = {
  block: HeadingBlockType;
  onUpdateContent: (id: string, content: string) => void;
};

export function HeadingBlock({ block, onUpdateContent }: Props) {
  if (block.level === 1) {
    return (
      <h1 className="mb-3 font-heading text-3xl font-bold tracking-tight text-foreground">
        <EditableText
          value={block.content}
          onCommit={(v) => onUpdateContent(block.id, v)}
          className="inline-block min-h-[1.5rem] w-full"
        />
      </h1>
    );
  }

  if (block.level === 2) {
    return (
      <h2 className={cn(
        "mt-5 mb-2 font-heading text-xl font-semibold tracking-tight text-foreground",
        "flex items-center gap-2",
        "before:content-['—'] before:text-foreground/20 before:font-normal before:text-sm",
      )}>
        <EditableText
          value={block.content}
          onCommit={(v) => onUpdateContent(block.id, v)}
          className="inline-block min-h-[1.35rem] w-full"
        />
      </h2>
    );
  }

  return (
    <h3 className="mt-3 mb-1 font-heading text-base font-semibold text-foreground/90">
      <EditableText
        value={block.content}
        onCommit={(v) => onUpdateContent(block.id, v)}
        className="inline-block min-h-[1.25rem] w-full"
      />
    </h3>
  );
}
