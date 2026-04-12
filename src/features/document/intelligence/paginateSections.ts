import { estimateSectionHeight } from "./estimateSectionHeight";
import type { ClassifiedSection, SectionPage } from "../model/types";

/**
 * Distributes classified sections across pages dynamically.
 *
 * Rules:
 * 1. Sections accumulate onto the current page until adding the next section
 *    would exceed pageContentHeightPx AND the current page is non-empty.
 * 2. A section taller than the full page height gets its own page.
 * 3. No empty pages are produced.
 * 4. Document order is preserved across all pages.
 *
 * Pure and deterministic: same inputs always produce same output.
 */
export function paginateSections(
  sections: ClassifiedSection[],
  pageContentHeightPx: number,
): SectionPage[] {
  if (sections.length === 0) return [];

  const pages: SectionPage[] = [];
  let currentSections: ClassifiedSection[] = [];
  let currentHeight = 0;

  for (const section of sections) {
    const h = estimateSectionHeight(section);

    const wouldOverflow = currentHeight + h > pageContentHeightPx;
    const pageIsNonEmpty = currentSections.length > 0;

    if (wouldOverflow && pageIsNonEmpty) {
      // Commit current page and start a new one
      pages.push({ sections: currentSections });
      currentSections = [];
      currentHeight = 0;
    }

    currentSections.push(section);
    currentHeight += h;
  }

  // Commit the final page
  if (currentSections.length > 0) {
    pages.push({ sections: currentSections });
  }

  return pages;
}
