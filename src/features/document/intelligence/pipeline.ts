import { analyzeSection } from "./analyzeSection";
import { classifySection } from "./classifySection";
import { groupIntoSections } from "./groupIntoSections";
import { paginateSections } from "./paginateSections";
import type { Block, SectionPage } from "../model/types";

/**
 * Runs the full semantic layout pipeline.
 *
 * Block[] → Section[] → SectionFeatures[] → ClassifiedSection[] → SectionPage[]
 *
 * Pure and deterministic: same inputs always produce same output.
 */
export function runPipeline(
  blocks: Block[],
  pageContentHeightPx: number,
): SectionPage[] {
  const sections = groupIntoSections(blocks);
  const total = sections.length;

  let featureIndex = 0;
  const classified = sections.map((section, index) => {
    const features = analyzeSection(section, index, total);
    const cs = classifySection(section, features, features.documentPosition === "first" ? 0 : featureIndex);
    if (cs.role !== "hero") featureIndex++;
    return cs;
  });

  return paginateSections(classified, pageContentHeightPx);
}
