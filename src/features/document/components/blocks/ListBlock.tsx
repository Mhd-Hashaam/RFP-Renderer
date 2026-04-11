"use client";

import type { ListBlock as ListBlockType } from "@/features/document/model/types";
import { EditableText } from "../editor/EditableText";
import { cn } from "@/lib/utils";

type Props = {
  block: ListBlockType;
  onUpdateItem: (id: string, index: number, value: string) => void;
};

export function ListBlock({ block, onUpdateItem }: Props) {
  const ListTag = block.style === "ordered" ? "ol" : "ul";
  const listClass =
    block.style === "ordered"
      ? "list-decimal pl-5 marker:text-muted-foreground"
      : "list-disc pl-5 marker:text-muted-foreground";

  return (
    <ListTag className={cn("mt-2 space-y-1 text-sm", listClass)}>
      {block.items.map((item, index) => (
        <li key={`${block.id}-item-${index}`} className="leading-relaxed">
          <EditableText
            value={item}
            onCommit={(v) => onUpdateItem(block.id, index, v)}
            className="inline-block min-h-[1.25rem] w-full text-foreground/90"
          />
        </li>
      ))}
    </ListTag>
  );
}
