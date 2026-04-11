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
      <h1 className="mt-1 mb-2 font-heading text-2xl font-bold tracking-tight text-foreground">
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
        "mt-5 mb-1.5 font-heading text-lg font-semibold tracking-tight text-foreground",
        "border-b border-border/50 pb-1",
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
    <h3 className="mt-4 mb-1 font-heading text-base font-semibold text-foreground/90">
      <EditableText
        value={block.content}
        onCommit={(v) => onUpdateContent(block.id, v)}
        className="inline-block min-h-[1.25rem] w-full"
      />
    </h3>
  );
}
