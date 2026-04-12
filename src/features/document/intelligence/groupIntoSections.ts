import type { Block, Section } from "../model/types";

/**
 * Groups a flat Block[] into semantic Section[].
 *
 * Rules:
 * - Each HeadingBlock starts a new section.
 * - Body blocks before the first heading accumulate into a section with heading: null.
 * - Section id = heading.id when a heading is present, else content[0].id.
 * - Pure and deterministic: same input always produces same output.
 */
export function groupIntoSections(blocks: Block[]): Section[] {
  if (blocks.length === 0) return [];

  const sections: Section[] = [];
  let currentHeading: Extract<Block, { type: "heading" }> | null = null;
  let currentContent: Block[] = [];

  const commitSection = () => {
    if (currentHeading === null && currentContent.length === 0) return;

    const id =
      currentHeading !== null
        ? currentHeading.id
        : (currentContent[0]?.id ?? "section-intro");

    sections.push({
      id,
      heading: currentHeading,
      content: currentContent,
    });
  };

  for (const block of blocks) {
    if (block.type === "heading") {
      commitSection();
      currentHeading = block;
      currentContent = [];
    } else {
      currentContent.push(block);
    }
  }

  commitSection();

  return sections;
}
