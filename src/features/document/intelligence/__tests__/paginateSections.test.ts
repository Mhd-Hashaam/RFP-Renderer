import { describe, expect, it } from "vitest";
import { paginateSections } from "../paginateSections";
import type { ClassifiedSection } from "../../model/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a ClassifiedSection with a controlled estimated height via paragraph content length. */
function makeSection(id: string, textLength: number): ClassifiedSection {
  return {
    id,
    heading: { id: `h-${id}`, type: "heading", level: 2, content: "T" },
    content: [
      {
        id: `p-${id}`,
        type: "paragraph",
        // estimateSectionHeight uses SECTION_HEIGHT_PER_CHAR_PX (0.3) per char
        // plus SECTION_HEIGHT_HEADING_PX (80) for the heading
        // So height ≈ 80 + textLength * 0.3
        content: "x".repeat(textLength),
      },
    ],
    role: "content",
    intent: { emphasis: "low", visualWeight: 10, layoutHint: "compact" },
    featureIndex: 0,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("paginateSections", () => {
  it("returns empty array for empty input", () => {
    expect(paginateSections([], 800)).toEqual([]);
  });

  it("single section fits on one page", () => {
    const sections = [makeSection("s1", 10)];
    const pages = paginateSections(sections, 800);
    expect(pages).toHaveLength(1);
    expect(pages[0].sections).toHaveLength(1);
  });

  it("multiple small sections fit on one page", () => {
    // Each section ≈ 80 + 10*0.3 = 83px; 5 sections ≈ 415px < 800
    const sections = Array.from({ length: 5 }, (_, i) => makeSection(`s${i}`, 10));
    const pages = paginateSections(sections, 800);
    expect(pages).toHaveLength(1);
    expect(pages[0].sections).toHaveLength(5);
  });

  it("sections that overflow page height start a new page", () => {
    // Each section ≈ 80 + 1000*0.3 = 380px; 3 sections = 1140px > 800
    const sections = Array.from({ length: 3 }, (_, i) => makeSection(`s${i}`, 1000));
    const pages = paginateSections(sections, 800);
    expect(pages.length).toBeGreaterThan(1);
  });

  it("preserves document order across pages", () => {
    const sections = Array.from({ length: 6 }, (_, i) => makeSection(`s${i}`, 1000));
    const pages = paginateSections(sections, 800);
    const allIds = pages.flatMap((p) => p.sections.map((s) => s.id));
    expect(allIds).toEqual(sections.map((s) => s.id));
  });

  it("no page is empty", () => {
    const sections = Array.from({ length: 4 }, (_, i) => makeSection(`s${i}`, 1000));
    const pages = paginateSections(sections, 800);
    for (const page of pages) {
      expect(page.sections.length).toBeGreaterThan(0);
    }
  });

  it("oversized section (taller than page) gets its own page", () => {
    // Section with 10000 chars ≈ 80 + 10000*0.3 = 3080px >> 800
    const big = makeSection("big", 10000);
    const small = makeSection("small", 10);
    const pages = paginateSections([big, small], 800);
    // big must be alone on its page
    expect(pages[0].sections[0].id).toBe("big");
    expect(pages[0].sections).toHaveLength(1);
  });

  it("all sections are accounted for (no loss, no duplication)", () => {
    const sections = Array.from({ length: 8 }, (_, i) => makeSection(`s${i}`, 500));
    const pages = paginateSections(sections, 800);
    const allIds = pages.flatMap((p) => p.sections.map((s) => s.id));
    expect(allIds).toHaveLength(sections.length);
    expect(new Set(allIds).size).toBe(sections.length);
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

import * as fc from "fast-check";
import type { ClassifiedSection as CS } from "../../model/types";

function arbSmallSection(id: string): CS {
  return {
    id,
    heading: { id: `h-${id}`, type: "heading", level: 2, content: "T" },
    content: [{ id: `p-${id}`, type: "paragraph", content: "x".repeat(10) }],
    role: "content",
    intent: { emphasis: "low", visualWeight: 10, layoutHint: "compact" },
    featureIndex: 0,
  };
}

function arbClassifiedSectionArray(): fc.Arbitrary<CS[]> {
  return fc.array(
    fc.uuid().map((id) => arbSmallSection(id)),
    { minLength: 0, maxLength: 15 },
  );
}

describe("paginateSections — property-based tests", () => {
  // Feature: semantic-layout-engine, Property 12: Pagination preserves all sections
  it("Property 12: ordered concatenation of all page sections equals input", () => {
    fc.assert(
      fc.property(arbClassifiedSectionArray(), fc.integer({ min: 200, max: 2000 }), (sections, pageHeight) => {
        const pages = paginateSections(sections, pageHeight);
        const allIds = pages.flatMap((p) => p.sections.map((s) => s.id));
        expect(allIds).toEqual(sections.map((s) => s.id));
      }),
      { numRuns: 100 },
    );
  });

  // Feature: semantic-layout-engine, Property 13: No empty pages
  it("Property 13: every SectionPage contains at least one section", () => {
    fc.assert(
      fc.property(arbClassifiedSectionArray(), fc.integer({ min: 200, max: 2000 }), (sections, pageHeight) => {
        const pages = paginateSections(sections, pageHeight);
        for (const page of pages) {
          expect(page.sections.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });
});
