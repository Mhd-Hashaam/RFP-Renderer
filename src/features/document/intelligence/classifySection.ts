import type {
  ClassifiedSection,
  LayoutHint,
  Section,
  SectionEmphasis,
  SectionFeatures,
  SectionIntent,
  SectionRole,
} from "../model/types";

/**
 * Classifies a section into a role and computes its visual intent.
 *
 * Decision tree (evaluated in order):
 * 1. documentPosition === "first"                          → "hero"
 * 2. headingLevel === 1 (non-first)                        → "feature" (H1 downgrade)
 * 3. imageCount >= 3                                       → "gallery"
 * 4. imageCount >= 1 && paragraphCount >= 1                → "feature"
 * 5. otherwise                                             → "content"
 *
 * Pure and deterministic: same inputs always produce same output.
 *
 * @param section      - The section to classify.
 * @param features     - Pre-computed features for this section.
 * @param featureIndex - Zero-based count of non-hero sections before this one.
 */
export function classifySection(
  section: Section,
  features: SectionFeatures,
  featureIndex: number,
): ClassifiedSection {
  const role = deriveRole(features);
  const intent = deriveIntent(role, features);

  return {
    ...section,
    role,
    intent,
    featureIndex,
  };
}

function deriveRole(features: SectionFeatures): SectionRole {
  if (features.documentPosition === "first") return "hero";
  if (features.headingLevel === 1) return "feature"; // H1 downgrade
  if (features.imageCount >= 3) return "gallery";
  if (features.imageCount >= 1 && features.paragraphCount >= 1) return "feature";
  return "content";
}

function deriveIntent(role: SectionRole, features: SectionFeatures): SectionIntent {
  const emphasis = deriveEmphasis(role);
  const layoutHint = deriveLayoutHint(role);
  const visualWeight = deriveVisualWeight(role, features);

  return { emphasis, layoutHint, visualWeight };
}

function deriveEmphasis(role: SectionRole): SectionEmphasis {
  switch (role) {
    case "hero":    return "high";
    case "feature": return "medium";
    case "gallery": return "medium";
    case "content": return "low";
    default: {
      const _never: never = role;
      void _never;
      return "low";
    }
  }
}

function deriveLayoutHint(role: SectionRole): LayoutHint {
  switch (role) {
    case "hero":    return "wide";
    case "feature": return "balanced";
    case "gallery": return "balanced";
    case "content": return "compact";
    default: {
      const _never: never = role;
      void _never;
      return "compact";
    }
  }
}

function deriveVisualWeight(role: SectionRole, features: SectionFeatures): number {
  let raw: number;

  switch (role) {
    case "hero":
      raw = 60 + features.imageCount * 10 + features.totalTextLength / 100;
      break;
    case "feature":
      raw = 40 + features.imageCount * 10 + features.totalTextLength / 150;
      break;
    case "gallery":
      raw = 30 + features.imageCount * 15;
      break;
    case "content":
      raw = 10 + features.totalTextLength / 200;
      break;
    default: {
      const _never: never = role;
      void _never;
      raw = 10;
    }
  }

  return Math.max(1, Math.min(100, Math.round(raw)));
}
