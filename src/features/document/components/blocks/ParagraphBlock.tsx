"use client";

import type { ParagraphBlock as ParagraphBlockType } from "@/features/document/model/types";
import { EditableText } from "../editor/EditableText";

type Props = {
  block: ParagraphBlockType;
  onUpdateContent: (id: string, content: string) => void;
};

export function ParagraphBlock({ block, onUpdateContent }: Props) {
  return (
    <div className="mt-2 text-[0.9375rem] leading-relaxed text-foreground/70">
      <EditableText
        value={block.content}
        onCommit={(v) => onUpdateContent(block.id, v)}
        className="w-full"
      />
    </div>
  );
}
