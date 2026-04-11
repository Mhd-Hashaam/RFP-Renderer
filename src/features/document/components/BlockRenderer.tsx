"use client";

import type { Block } from "@/features/document/model/types";
import { GroupBlock } from "./blocks/GroupBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { ListBlock } from "./blocks/ListBlock";
import { ParagraphBlock } from "./blocks/ParagraphBlock";

type Props = {
  block: Block;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
  /** Hint from parent layout unit — image paired with H1 gets hero treatment */
  hero?: boolean;
};

export function BlockRenderer({
  block,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
  hero = false,
}: Props) {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} onUpdateContent={onUpdateHeading} />;
    case "paragraph":
      return <ParagraphBlock block={block} onUpdateContent={onUpdateParagraph} />;
    case "list":
      return <ListBlock block={block} onUpdateItem={onUpdateListItem} />;
    case "image":
      return <ImageBlock block={block} hero={hero} />;
    case "group":
      return (
        <GroupBlock
          block={block}
          onUpdateHeading={onUpdateHeading}
          onUpdateParagraph={onUpdateParagraph}
          onUpdateListItem={onUpdateListItem}
        />
      );
    default: {
      const _never: never = block;
      return _never;
    }
  }
}
