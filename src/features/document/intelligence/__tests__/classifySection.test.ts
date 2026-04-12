import { describe, expect, it } from "vitest";
import { classifySection } from "../classifySection";
import type { Section, SectionFeatures } from "../../model/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeSection = (id = "s1"): Section => ({
  id,
  heading: { id, type: "heading", level: 2, content: "Title" },
  content: [],
});

const makeFeatures = (
  overrides: Partial<SectionFeatures> = {},
): SectionFeatures => ({
  headingLevel: 2,
  imageCount: 0,
  paragraphCount: 0,
  listCount: 0,
  totalTextLength: 0,
  documentPosition: "middle",
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("classifySection", () => {
  describe("role assignment", () => {
    it("first section is always hero regardless of content", () => {
      const features = makeFeatures({ documentPosition: "first", imageCount: 0, paragraphCount: 0 });
      const result = classifySection(makeSection(), features, 0);
      expect(result.role).toBe("hero");
    });

    it("first section with 3+ images is still hero (position wins)", () => {
      const features = makeFeatures({ documentPosition: "first", imageCount: 5 });
      const result = classifySection(makeSection(), features, 0);
      expect(result.role).toBe("hero");
    });

    it("non-first H1 is downgraded to feature", () => {
      const features = makeFeatures({ documentPosition: "middle", headingLevel: 1 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("feature");
    });

    it("3 images → gallery", () => {
      const features = makeFeatures({ documentPosition: "middle", imageCount: 3 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("gallery");
    });

    it("4 images → gallery", () => {
      const features = makeFeatures({ documentPosition: "middle", imageCount: 4 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("gallery");
    });

    it("1 image + 1 paragraph → feature", () => {
      const features = makeFeatures({ documentPosition: "middle", imageCount: 1, paragraphCount: 1 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("feature");
    });

    it("2 images + 1 paragraph → feature (imageCount < 3)", () => {
      const features = makeFeatures({ documentPosition: "middle", imageCount: 2, paragraphCount: 1 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("feature");
    });

    it("image only (no paragraph) → content", () => {
      const features = makeFeatures({ documentPosition: "middle", imageCount: 1, paragraphCount: 0 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("content");
    });

    it("text only → content", () => {
      const features = makeFeatures({ documentPosition: "middle", imageCount: 0, paragraphCount: 2 });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("content");
    });

    it("empty section → content", () => {
      const features = makeFeatures({ documentPosition: "last" });
      const result = classifySection(makeSection(), features, 1);
      expect(result.role).toBe("content");
    });
  });

  describe("SectionIntent", () => {
    it("hero has emphasis 'high' and layoutHint 'wide'", () => {
      const result = classifySection(makeSection(), makeFeatures({ documentPosition: "first" }), 0);
      expect(result.intent.emphasis).toBe("high");
      expect(result.intent.layoutHint).toBe("wide");
    });

    it("feature has emphasis 'medium' and layoutHint 'balanced'", () => {
      const result = classifySection(makeSection(), makeFeatures({ documentPosition: "middle", imageCount: 1, paragraphCount: 1 }), 1);
      expect(result.intent.emphasis).toBe("medium");
      expect(result.intent.layoutHint).toBe("balanced");
    });

    it("gallery has emphasis 'medium' and layoutHint 'balanced'", () => {
      const result = classifySection(makeSection(), makeFeatures({ documentPosition: "middle", imageCount: 3 }), 1);
      expect(result.intent.emphasis).toBe("medium");
      expect(result.intent.layoutHint).toBe("balanced");
    });

    it("content has emphasis 'low' and layoutHint 'compact'", () => {
      const result = classifySection(makeSection(), makeFeatures({ documentPosition: "middle" }), 1);
      expect(result.intent.emphasis).toBe("low");
      expect(result.intent.layoutHint).toBe("compact");
    });

    it("visualWeight is an integer in [1, 100]", () => {
      const features = makeFeatures({ documentPosition: "first", imageCount: 1, totalTextLength: 500 });
      const result = classifySection(makeSection(), features, 0);
      expect(result.intent.visualWeight).toBeGreaterThanOrEqual(1);
      expect(result.intent.visualWeight).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.intent.visualWeight)).toBe(true);
    });
  });

  describe("featureIndex", () => {
    it("passes featureIndex through to ClassifiedSection", () => {
      const result = classifySection(makeSection(), makeFeatures({ documentPosition: "middle" }), 3);
      expect(result.featureIndex).toBe(3);
    });

    it("hero section gets featureIndex 0 (passed in)", () => {
      const result = classifySection(makeSection(), makeFeatures({ documentPosition: "first" }), 0);
      expect(result.featureIndex).toBe(0);
    });
  });

  describe("idempotence", () => {
    it("classifying twice with same inputs produces equal output", () => {
      const section = makeSection("s1");
      const features = makeFeatures({ documentPosition: "middle", imageCount: 1, paragraphCount: 1 });
      const a = classifySection(section, features, 2);
      const b = classifySection(section, features, 2);
      expect(a).toEqual(b);
    });
  });
});
