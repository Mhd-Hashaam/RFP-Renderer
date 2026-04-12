import { describe, expect, it } from "vitest";
import { analyzeSection } from "../analyzeSection";
import type { Block, Section } from "../../model/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeSection = (
  heading: Section["heading"],
  content: Block[],
): Section => ({
  id: heading?.id ?? content[0]?.id ?? "s",
  heading,
  content,
});

const h = (id: string, content = "Title", level: 1 | 2 | 3 = 2): Extract<Block, { type: "heading" }> => ({
  id,
  type: "heading",
  level,
  content,
});

const p = (id: string, content = "Hello world"): Block => ({
  id,
  type: "paragraph",
  content,
});

const img = (id: string, alt = "alt", caption?: string): Block => ({
  id,
  type: "image",
  src: "/img.webp",
  alt,
  caption,
});

const list = (id: string, items: string[] = ["a", "b"]): Block => ({
  id,
  type: "list",
  style: "unordered",
  items,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("analyzeSection", () => {
  it("counts images correctly", () => {
    const section = makeSection(h("h1"), [img("i1"), img("i2")]);
    const features = analyzeSection(section, 0, 3);
    expect(features.imageCount).toBe(2);
  });

  it("counts paragraphs correctly", () => {
    const section = makeSection(h("h1"), [p("p1"), p("p2"), p("p3")]);
    const features = analyzeSection(section, 0, 3);
    expect(features.paragraphCount).toBe(3);
  });

  it("counts lists correctly", () => {
    const section = makeSection(h("h1"), [list("l1"), list("l2")]);
    const features = analyzeSection(section, 0, 3);
    expect(features.listCount).toBe(2);
  });

  it("returns headingLevel from heading block", () => {
    const section = makeSection(h("h1", "Title", 1), []);
    expect(analyzeSection(section, 0, 1).headingLevel).toBe(1);
  });

  it("returns null headingLevel when section has no heading", () => {
    const section = makeSection(null, [p("p1")]);
    expect(analyzeSection(section, 0, 1).headingLevel).toBeNull();
  });

  it("sums totalTextLength across heading and paragraphs", () => {
    const section = makeSection(h("h1", "AB"), [p("p1", "CDE")]);
    const features = analyzeSection(section, 0, 1);
    // "AB" = 2, "CDE" = 3
    expect(features.totalTextLength).toBe(5);
  });

  it("includes list item lengths in totalTextLength", () => {
    const section = makeSection(null, [list("l1", ["abc", "de"])]);
    const features = analyzeSection(section, 0, 1);
    // "abc" = 3, "de" = 2
    expect(features.totalTextLength).toBe(5);
  });

  it("documentPosition is 'first' for index 0", () => {
    const section = makeSection(h("h1"), []);
    expect(analyzeSection(section, 0, 5).documentPosition).toBe("first");
  });

  it("documentPosition is 'last' for index === total - 1", () => {
    const section = makeSection(h("h1"), []);
    expect(analyzeSection(section, 4, 5).documentPosition).toBe("last");
  });

  it("documentPosition is 'middle' for indices between first and last", () => {
    const section = makeSection(h("h1"), []);
    expect(analyzeSection(section, 2, 5).documentPosition).toBe("middle");
  });

  it("handles section with only an image (no text)", () => {
    const section = makeSection(null, [img("i1", "alt text")]);
    const features = analyzeSection(section, 0, 1);
    expect(features.imageCount).toBe(1);
    expect(features.paragraphCount).toBe(0);
    expect(features.listCount).toBe(0);
  });

  it("single-section document: index 0 is both first and last → 'first' wins", () => {
    const section = makeSection(h("h1"), []);
    // total = 1, index = 0 → first
    expect(analyzeSection(section, 0, 1).documentPosition).toBe("first");
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

import * as fc from "fast-check";
import type { Block as BlockType, Section as SectionType } from "../../model/types";

function arbContentBlock(): fc.Arbitrary<BlockType> {
  return fc.oneof(
    fc.record({ id: fc.uuid(), type: fc.constant("paragraph" as const), content: fc.string({ minLength: 0, maxLength: 80 }) }),
    fc.record({ id: fc.uuid(), type: fc.constant("image" as const), src: fc.constant("/img.webp"), alt: fc.string({ minLength: 1, maxLength: 10 }), caption: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }) }),
    fc.record({ id: fc.uuid(), type: fc.constant("list" as const), style: fc.constantFrom("ordered" as const, "unordered" as const), items: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 4 }) }),
  ) as fc.Arbitrary<BlockType>;
}

function arbSection(): fc.Arbitrary<SectionType> {
  return fc.record({
    id: fc.uuid(),
    heading: fc.option(
      fc.record({ id: fc.uuid(), type: fc.constant("heading" as const), level: fc.constantFrom(1 as const, 2 as const, 3 as const), content: fc.string({ minLength: 0, maxLength: 40 }) }),
      { nil: null },
    ),
    content: fc.array(arbContentBlock(), { minLength: 0, maxLength: 8 }),
  }) as fc.Arbitrary<SectionType>;
}

describe("analyzeSection — property-based tests", () => {
  // Feature: semantic-layout-engine, Property 4: analyzeSection feature counts are accurate
  it("Property 4: imageCount, paragraphCount, listCount match actual block counts", () => {
    fc.assert(
      fc.property(arbSection(), fc.nat({ max: 10 }), fc.integer({ min: 1, max: 20 }), (section, index, total) => {
        const safeIndex = Math.min(index, total - 1);
        const features = analyzeSection(section, safeIndex, total);

        const actualImages = section.content.filter((b) => b.type === "image").length;
        const actualParas = section.content.filter((b) => b.type === "paragraph").length;
        const actualLists = section.content.filter((b) => b.type === "list").length;

        expect(features.imageCount).toBe(actualImages);
        expect(features.paragraphCount).toBe(actualParas);
        expect(features.listCount).toBe(actualLists);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: semantic-layout-engine, Property 5: documentPosition is correctly assigned
  it("Property 5: documentPosition is 'first' at index 0, 'last' at index total-1, 'middle' otherwise", () => {
    fc.assert(
      fc.property(arbSection(), fc.integer({ min: 2, max: 20 }), (section, total) => {
        expect(analyzeSection(section, 0, total).documentPosition).toBe("first");
        expect(analyzeSection(section, total - 1, total).documentPosition).toBe("last");
        if (total > 2) {
          expect(analyzeSection(section, 1, total).documentPosition).toBe("middle");
        }
      }),
      { numRuns: 100 },
    );
  });
});
