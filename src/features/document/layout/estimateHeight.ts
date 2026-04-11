import type { Block } from "../model/types";

/**
 * Heuristic heights for pagination. Pure and deterministic for a given block tree.
 */
export function estimateBlockHeightPx(block: Block): number {
  switch (block.type) {
    case "heading": {
      const base = 36 + block.level * 8;
      return base + Math.min(120, block.content.length * 0.35);
    }
    case "paragraph":
      return Math.max(
        52,
        Math.min(520, 40 + block.content.length * 0.42),
      );
    case "list": {
      const perItem = 30;
      return 28 + block.items.length * perItem;
    }
    case "image":
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

export function estimateLayoutUnitHeightPx(unit: {
  blocks: Block[];
}): number {
  return unit.blocks.reduce((sum, b) => sum + estimateBlockHeightPx(b), 0);
}
