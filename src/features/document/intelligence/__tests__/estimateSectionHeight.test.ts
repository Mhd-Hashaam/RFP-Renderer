import { describe, expect, it } from "vitest";
import { estimateSectionHeight } from "../estimateSectionHeight";
import {
  SECTION_HEIGHT_HEADING_PX,
  SECTION_HEIGHT_MIN_PX,
  SECTION_HEIGHT_PER_IMAGE_PX,
} from "../../model/constants";
import type { ClassifiedSection } from "../../model/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeClassified = (
  overrides: Partial<ClassifiedSection> = {},
): ClassifiedSection => ({
  id: "s1",
  heading: null,
  content: [],
  role: "content",
  intent: { emphasis: "low", visualWeight: 10, layoutHint: "compact" },
  featureIndex: 0,
  ...overrides,
});

const heading = (content = "Title"): ClassifiedSection["heading"] => ({
  id: "h1",
  type: "heading",
  level: 2,
  content,
});

const imgBlock = (id = "i1"): Extract<ClassifiedSection["content"][number], { type: "image" }> => ({
  id,
  type: "image",
  src: "/img.webp",
  alt: "alt",
});

const paraBlock = (content = "Hello"): Extract<ClassifiedSection["content"][number], { type: "paragraph" }> => ({
  id: "p1",
  type: "paragraph",
  content,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("estimateSectionHeight", () => {
  it("returns at least SECTION_HEIGHT_MIN_PX for empty section", () => {
    const section = makeClassified();
    expect(estimateSectionHeight(section)).toBeGreaterThanOrEqual(SECTION_HEIGHT_MIN_PX);
  });

  it("heading adds SECTION_HEIGHT_HEADING_PX to the estimate", () => {
    const withoutHeading = makeClassified({ heading: null, content: [] });
    const withHeading = makeClassified({ heading: heading("AB"), content: [] });
    const diff = estimateSectionHeight(withHeading) - estimateSectionHeight(withoutHeading);
    // Heading adds HEADING_PX + text length contribution
    expect(diff).toBeGreaterThanOrEqual(SECTION_HEIGHT_HEADING_PX);
  });

  it("each image adds approximately SECTION_HEIGHT_PER_IMAGE_PX", () => {
    const noImage = makeClassified({ content: [] });
    const oneImage = makeClassified({ content: [imgBlock()] });
    const diff = estimateSectionHeight(oneImage) - estimateSectionHeight(noImage);
    expect(diff).toBeGreaterThanOrEqual(SECTION_HEIGHT_PER_IMAGE_PX);
  });

  it("two images produce higher estimate than one image", () => {
    const oneImage = makeClassified({ content: [imgBlock("i1")] });
    const twoImages = makeClassified({ content: [imgBlock("i1"), imgBlock("i2")] });
    expect(estimateSectionHeight(twoImages)).toBeGreaterThan(estimateSectionHeight(oneImage));
  });

  it("longer paragraph produces higher estimate than shorter paragraph", () => {
    const short = makeClassified({ content: [paraBlock("Hi")] });
    const long = makeClassified({ content: [paraBlock("Hi".repeat(100))] });
    expect(estimateSectionHeight(long)).toBeGreaterThan(estimateSectionHeight(short));
  });

  it("returns a positive integer", () => {
    const section = makeClassified({ heading: heading("Title"), content: [imgBlock(), paraBlock("text")] });
    const h = estimateSectionHeight(section);
    expect(h).toBeGreaterThan(0);
    expect(Number.isInteger(h)).toBe(true);
  });

  it("hero section with image has higher estimate than content section with same image (multiplier)", () => {
    const content = makeClassified({
      role: "content",
      intent: { emphasis: "low", visualWeight: 10, layoutHint: "compact" },
      content: [imgBlock()],
    });
    const hero = makeClassified({
      role: "hero",
      intent: { emphasis: "high", visualWeight: 80, layoutHint: "wide" },
      content: [imgBlock()],
    });
    expect(estimateSectionHeight(hero)).toBeGreaterThan(estimateSectionHeight(content));
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

import * as fc from "fast-check";
import type { ClassifiedSection as ClassifiedSectionType } from "../../model/types";

function arbClassifiedSection(): fc.Arbitrary<ClassifiedSectionType> {
  const arbRole = fc.constantFrom("hero" as const, "feature" as const, "gallery" as const, "content" as const);
  return arbRole.chain((role) =>
    fc.record({
      id: fc.uuid(),
      heading: fc.option(
        fc.record({ id: fc.uuid(), type: fc.constant("heading" as const), level: fc.constantFrom(1 as const, 2 as const, 3 as const), content: fc.string({ minLength: 0, maxLength: 40 }) }),
        { nil: null },
      ),
      content: fc.array(
        fc.oneof(
          fc.record({ id: fc.uuid(), type: fc.constant("paragraph" as const), content: fc.string({ minLength: 0, maxLength: 100 }) }),
          fc.record({ id: fc.uuid(), type: fc.constant("image" as const), src: fc.constant("/img.webp"), alt: fc.string({ minLength: 1, maxLength: 10 }) }),
        ),
        { minLength: 0, maxLength: 5 },
      ),
      role: fc.constant(role),
      intent: fc.record({
        emphasis: fc.constant(role === "hero" ? "high" as const : role === "content" ? "low" as const : "medium" as const),
        visualWeight: fc.integer({ min: 1, max: 100 }),
        layoutHint: fc.constant(role === "hero" ? "wide" as const : role === "content" ? "compact" as const : "balanced" as const),
      }),
      featureIndex: fc.nat({ max: 10 }),
    }) as fc.Arbitrary<ClassifiedSectionType>,
  );
}

describe("estimateSectionHeight — property-based tests", () => {
  // Feature: semantic-layout-engine, Property 10: estimateSectionHeight is always positive
  it("Property 10: estimateSectionHeight returns a value >= 1 for any section", () => {
    fc.assert(
      fc.property(arbClassifiedSection(), (section) => {
        expect(estimateSectionHeight(section)).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: semantic-layout-engine, Property 11: estimateSectionHeight is monotone with content
  it("Property 11: adding an ImageBlock strictly increases the estimate", () => {
    fc.assert(
      fc.property(arbClassifiedSection(), (section) => {
        const withoutImage: ClassifiedSectionType = {
          ...section,
          content: section.content.filter((b) => b.type !== "image"),
        };
        const withImage: ClassifiedSectionType = {
          ...withoutImage,
          content: [
            ...withoutImage.content,
            { id: "extra-img", type: "image" as const, src: "/img.webp", alt: "extra" },
          ],
        };
        expect(estimateSectionHeight(withImage)).toBeGreaterThan(estimateSectionHeight(withoutImage));
      }),
      { numRuns: 100 },
    );
  });
});
