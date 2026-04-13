import type { Block, DocumentPosition, Section, SectionFeatures } from "../model/types";

/**
 * Computes measurable features of a section.
 *
 * Pure and deterministic: same inputs always produce same output.
 *
 * @param section - The section to analyze.
 * @param index   - Zero-based position of this section in the full Section[].
 * @param total   - Total number of sections in the document.
 */
export function analyzeSection(
  section: Section,
  index: number,
  total: number,
): SectionFeatures {
  let imageCount = 0;
  let paragraphCount = 0;
  let listCount = 0;
  let totalTextLength = 0;

  // Heading text length
  if (section.heading !== null) {
    totalTextLength += section.heading.content.length;
  }

  for (const block of section.content) {
    totalTextLength += measureBlockTextLength(block);

    switch (block.type) {
      case "image":
        imageCount++;
        break;
      case "paragraph":
        paragraphCount++;
        break;
      case "list":
        listCount++;
        break;
      case "heading":
      case "group":
        break;
      case "meta":
        break;
      default: {
        const _never: never = block;
        void _never;
      }
    }
  }

  const documentPosition: DocumentPosition =
    index === 0 ? "first" : index === total - 1 ? "last" : "middle";

  return {
    headingLevel: section.heading?.level ?? null,
    imageCount,
    paragraphCount,
    listCount,
    totalTextLength,
    documentPosition,
  };
}

function measureBlockTextLength(block: Block): number {
  switch (block.type) {
    case "heading":
      return block.content.length;
    case "paragraph":
      return block.content.length;
    case "list":
      return block.items.reduce((sum, item) => sum + item.length, 0);
    case "image":
      return (block.caption?.length ?? 0) + block.alt.length;
    case "meta":
      return block.items.reduce((sum, item) => sum + item.label.length + item.value.length, 0);
    case "group":
      return block.children.reduce(
        (sum, child) => sum + measureBlockTextLength(child),
        0,
      );
    default: {
      const _never: never = block;
      void _never;
      return 0;
    }
  }
}
