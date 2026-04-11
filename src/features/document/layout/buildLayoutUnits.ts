import { isBodyBlock } from "../model/constants";
import type { Block, LayoutUnit } from "../model/types";

/**
 * Groups headings with the following body block so pagination never splits them.
 * Operates on the canonical flat block list only (not nested children).
 */
export function buildLayoutUnits(blocks: Block[]): LayoutUnit[] {
  const units: LayoutUnit[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];

    if (current.type === "heading") {
      const next = blocks[i + 1];
      if (next && isBodyBlock(next)) {
        units.push({
          id: `unit:${current.id}`,
          blocks: [current, next],
        });
        i += 1;
        continue;
      }

      units.push({ id: current.id, blocks: [current] });
      continue;
    }

    units.push({ id: current.id, blocks: [current] });
  }

  return units;
}
