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

// ─── Semantic Layout Engine — section height estimation constants ─────────────

/** Page content height for section-based pagination (px). */
export const SECTION_PAGE_CONTENT_HEIGHT_PX = 1200;

/** Height contribution per image block (px). */
export const SECTION_HEIGHT_PER_IMAGE_PX = 280;

/** Height contribution per character of text content (px). */
export const SECTION_HEIGHT_PER_CHAR_PX = 0.3;

/** Fixed height contribution for a section heading (px). */
export const SECTION_HEIGHT_HEADING_PX = 80;

/** Minimum height returned for any section (px). */
export const SECTION_HEIGHT_MIN_PX = 1;
