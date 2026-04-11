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
      ? "list-decimal pl-5 marker:text-muted-foreground/60"
      : "list-disc pl-5 marker:text-muted-foreground/60";

  return (
    <ListTag className={cn("mt-2 space-y-1.5 text-sm leading-relaxed", listClass)}>
      {block.items.map((item, index) => (
        <li key={`${block.id}-item-${index}`} className="text-foreground/75">
          <EditableText
            value={item}
            onCommit={(v) => onUpdateItem(block.id, index, v)}
            className="inline-block min-h-[1.25rem] w-full"
          />
        </li>
      ))}
    </ListTag>
  );
}
