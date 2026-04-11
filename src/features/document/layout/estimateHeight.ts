import type { Block, LayoutUnit } from "../model/types";

/**
 * Type-aware height estimation. Pure and deterministic.
 * Tuned for the Gothic architecture RFP dataset — images are heavy,
 * paragraphs scale with content length, lists scale with item count.
 */
export function estimateBlockHeightPx(block: Block): number {
  switch (block.type) {
    case "heading":
      return block.level === 1 ? 70 : 50;

    case "paragraph":
      // 40px base + 0.35px per char, capped at 200px
      return Math.min(200, 40 + block.content.length * 0.35);

    case "list":
      // 30px base + 26px per item
      return 30 + block.items.length * 26;

    case "image":
      // Fixed strong weight — images are layout anchors
      return 240;

    case "group":
      return (
        16 +
        block.children.reduce(
          (sum, child) => sum + estimateBlockHeightPx(child),
          0,
        )
      );

    default: {
      const _never: never = block;
      return _never;
    }
  }
}

export function estimateLayoutUnitHeightPx(unit: LayoutUnit): number {
  return unit.blocks.reduce((sum, b) => sum + estimateBlockHeightPx(b), 0);
}

/** Returns true if a layout unit contains an image block */
export function unitHasImage(unit: LayoutUnit): boolean {
  return unit.blocks.some((b) => b.type === "image");
}
