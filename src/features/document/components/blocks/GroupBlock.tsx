"use client";

import type { GroupBlock as GroupBlockType } from "@/features/document/model/types";
import { BlockRenderer } from "../BlockRenderer";

type Props = {
  block: GroupBlockType;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function GroupBlock({
  block,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  return (
    <div className="border-muted mt-3 space-y-2 rounded-md border border-dashed p-3">
      {block.children.map((child) => (
        <BlockRenderer
          key={child.id}
          block={child}
          onUpdateHeading={onUpdateHeading}
          onUpdateParagraph={onUpdateParagraph}
          onUpdateListItem={onUpdateListItem}
        />
      ))}
    </div>
  );
}
