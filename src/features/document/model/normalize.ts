import { nanoid } from "nanoid";
import type { Block, HeadingLevel, RawBlockInput } from "./types";

function asHeadingLevel(level: number): HeadingLevel {
  if (level === 2 || level === 3) return level;
  return 1;
}

export function normalizeBlocks(input: RawBlockInput[]): Block[] {
  return input.map((raw) => normalizeBlock(raw));
}

function normalizeBlock(raw: RawBlockInput): Block {
  const id = raw.id ?? nanoid();

  switch (raw.type) {
    case "heading":
      return {
        id,
        type: "heading",
        level: asHeadingLevel(raw.level),
        content: raw.content,
      };
    case "paragraph":
      return { id, type: "paragraph", content: raw.content };
    case "list":
      return {
        id,
        type: "list",
        style: raw.style,
        items: [...raw.items],
      };
    case "image":
      return {
        id,
        type: "image",
        src: raw.src,
        alt: raw.alt,
        caption: raw.caption,
      };
    case "group":
      return {
        id,
        type: "group",
        children: raw.children.map((c) => normalizeBlock(c)),
      };
    default: {
      const _exhaustive: never = raw;
      throw new Error(`Unknown block type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
