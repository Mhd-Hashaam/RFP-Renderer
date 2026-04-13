"use client";

import type { MetaBlock as MetaBlockType } from "@/features/document/model/types";

type Props = {
  block: MetaBlockType;
};

/**
 * Renders a structured metadata grid — used in hero sections to fill
 * content density with meaningful project details (client, location, type, etc.)
 */
export function MetaBlock({ block }: Props) {
  return (
    <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-border pt-6">
      {block.items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm font-medium text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
