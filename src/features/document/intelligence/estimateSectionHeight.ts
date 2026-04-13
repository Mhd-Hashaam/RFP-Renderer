import {
  SECTION_HEIGHT_HEADING_PX,
  SECTION_HEIGHT_MIN_PX,
  SECTION_HEIGHT_PER_CHAR_PX,
  SECTION_HEIGHT_PER_IMAGE_PX,
} from "../model/constants";
import type { ClassifiedSection } from "../model/types";

/**
 * Estimates the rendered height of a classified section in pixels.
 *
 * Formula:
 *   imageCount × PER_IMAGE + totalTextLength × PER_CHAR + (heading ? HEADING : 0)
 *
 * Returns at least SECTION_HEIGHT_MIN_PX (1px) for any non-empty section.
 * Pure and deterministic: same input always produces same output.
 */
export function estimateSectionHeight(section: ClassifiedSection): number {
  const { intent, heading, content } = section;

  // Count images and sum text length from the section's content
  let imageCount = 0;
  let totalTextLength = 0;

  if (heading !== null) {
    totalTextLength += heading.content.length;
  }

  for (const block of content) {
    switch (block.type) {
      case "image":
        imageCount++;
        totalTextLength += (block.caption?.length ?? 0) + block.alt.length;
        break;
      case "paragraph":
        totalTextLength += block.content.length;
        break;
      case "list":
        totalTextLength += block.items.reduce((s, i) => s + i.length, 0);
        break;
      case "heading":
        totalTextLength += block.content.length;
        break;
      case "group":
        // Groups are rare in this dataset; treat as a flat text contribution
        totalTextLength += block.children.reduce(
          (s, c) => s + (c.type === "paragraph" ? c.content.length : 0),
          0,
        );
        break;
      case "meta":
        totalTextLength += block.items.reduce(
          (s, item) => s + item.label.length + item.value.length,
          0,
        );
        break;
      default: {
        const _never: never = block;
        void _never;
      }
    }
  }

  // visualWeight scales the image height slightly for hero sections
  const imageHeightMultiplier = intent.emphasis === "high" ? 1.2 : 1;

  const raw =
    imageCount * SECTION_HEIGHT_PER_IMAGE_PX * imageHeightMultiplier +
    totalTextLength * SECTION_HEIGHT_PER_CHAR_PX +
    (heading !== null ? SECTION_HEIGHT_HEADING_PX : 0);

  return Math.max(SECTION_HEIGHT_MIN_PX, Math.round(raw));
}
