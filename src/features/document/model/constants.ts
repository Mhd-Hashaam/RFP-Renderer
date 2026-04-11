import type { Block, BodyBlockType } from "./types";

/** Max height of the scrollable content area inside one page (px). */
export const PAGE_CONTENT_HEIGHT_PX = 800;

export const COLUMN_COUNT_LG = 3;
export const COLUMN_COUNT_MD = 2;
export const COLUMN_COUNT_SM = 1;

export const BODY_TYPES = [
  "paragraph",
  "list",
  "image",
  "group",
] as const satisfies readonly BodyBlockType[];

export function isBodyBlock(block: Block): boolean {
  return (BODY_TYPES as readonly string[]).includes(block.type);
}
