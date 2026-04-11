"use client";

import type { HeadingBlock as HeadingBlockType } from "@/features/document/model/types";
import { EditableText } from "../editor/EditableText";
import { cn } from "@/lib/utils";

type Props = {
  block: HeadingBlockType;
  onUpdateContent: (id: string, content: string) => void;
};

const levelClass: Record<HeadingBlockType["level"], string> = {
  1: "text-2xl font-semibold tracking-tight",
  2: "text-xl font-semibold tracking-tight",
  3: "text-lg font-semibold tracking-tight",
};

export function HeadingBlock({ block, onUpdateContent }: Props) {
  const className = cn("text-foreground", levelClass[block.level]);

  if (block.level === 1) {
    return (
      <h1 className={cn(className, "mt-1")}>
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
      <h2 className={cn(className, "mt-3")}>
        <EditableText
          value={block.content}
          onCommit={(v) => onUpdateContent(block.id, v)}
          className="inline-block min-h-[1.35rem] w-full"
        />
      </h2>
    );
  }

  return (
    <h3 className={cn(className, "mt-2")}>
      <EditableText
        value={block.content}
        onCommit={(v) => onUpdateContent(block.id, v)}
        className="inline-block min-h-[1.25rem] w-full"
      />
    </h3>
  );
}
