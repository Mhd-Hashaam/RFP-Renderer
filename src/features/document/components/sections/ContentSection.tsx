"use client";

import { EditableText } from "../editor/EditableText";
import { BlockRenderer } from "../BlockRenderer";
import type { ClassifiedSection, DeviceCapability } from "@/features/document/model/types";

type Props = {
  section: ClassifiedSection;
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

export function ContentSection({
  section,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  return (
    <section
      data-section-id={section.id}
      className="mb-16 max-w-prose"
    >
      {section.heading && (
        <h2 className="mb-3 font-heading text-xl font-semibold tracking-tight text-zinc-100">
          <EditableText
            value={section.heading.content}
            onCommit={(v) => onUpdateHeading(section.heading!.id, v)}
            className="inline-block w-full"
          />
        </h2>
      )}

      <div className="space-y-6">
        {section.content.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            onUpdateHeading={onUpdateHeading}
            onUpdateParagraph={onUpdateParagraph}
            onUpdateListItem={onUpdateListItem}
          />
        ))}
      </div>
    </section>
  );
}
