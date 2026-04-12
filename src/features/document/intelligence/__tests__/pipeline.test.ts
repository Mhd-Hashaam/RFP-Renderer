import { describe, expect, it } from "vitest";
import { runPipeline } from "../pipeline";
import type { Block } from "../../model/types";
import mockData from "../../model/mock-data.json";
import { normalizeBlocks } from "../../model/normalize";
import type { RawBlockInput } from "../../model/types";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("runPipeline", () => {
  it("returns empty array for empty blocks", () => {
    expect(runPipeline([], 1200)).toEqual([]);
  });

  it("single block produces one page with one section", () => {
    const blocks: Block[] = [{ id: "p1", type: "paragraph", content: "Hello" }];
    const pages = runPipeline(blocks, 1200);
    expect(pages).toHaveLength(1);
    expect(pages[0].sections).toHaveLength(1);
  });

  it("all blocks from mock-data are accounted for in the output", () => {
    const blocks = normalizeBlocks(mockData as RawBlockInput[]);
    const pages = runPipeline(blocks, 1200);

    // Collect all blocks from all sections across all pages
    const outputBlocks = pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.heading
          ? [section.heading, ...section.content]
          : section.content,
      ),
    );

    expect(outputBlocks.map((b) => b.id)).toEqual(blocks.map((b) => b.id));
  });

  it("produces at least one page for non-empty input", () => {
    const blocks = normalizeBlocks(mockData as RawBlockInput[]);
    const pages = runPipeline(blocks, 1200);
    expect(pages.length).toBeGreaterThan(0);
  });

  it("first section on first page is always hero", () => {
    const blocks = normalizeBlocks(mockData as RawBlockInput[]);
    const pages = runPipeline(blocks, 1200);
    expect(pages[0].sections[0].role).toBe("hero");
  });

  it("is deterministic — two calls with same input produce equal output", () => {
    const blocks = normalizeBlocks(mockData as RawBlockInput[]);
    const a = runPipeline(blocks, 1200);
    const b = runPipeline(blocks, 1200);
    expect(a).toEqual(b);
  });

  it("featureIndex increments monotonically across non-hero sections", () => {
    const blocks = normalizeBlocks(mockData as RawBlockInput[]);
    const pages = runPipeline(blocks, 1200);
    const allSections = pages.flatMap((p) => p.sections);
    const nonHero = allSections.filter((s) => s.role !== "hero");
    nonHero.forEach((s, i) => {
      expect(s.featureIndex).toBe(i);
    });
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

import * as fc from "fast-check";
import type { Block as BlockType } from "../../model/types";

function arbPipelineBlock(): fc.Arbitrary<BlockType> {
  return fc.oneof(
    fc.record({ id: fc.uuid(), type: fc.constant("heading" as const), level: fc.constantFrom(1 as const, 2 as const, 3 as const), content: fc.string({ minLength: 1, maxLength: 30 }) }),
    fc.record({ id: fc.uuid(), type: fc.constant("paragraph" as const), content: fc.string({ minLength: 1, maxLength: 80 }) }),
    fc.record({ id: fc.uuid(), type: fc.constant("list" as const), style: fc.constantFrom("ordered" as const, "unordered" as const), items: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 4 }) }),
    fc.record({ id: fc.uuid(), type: fc.constant("image" as const), src: fc.constant("/img.webp"), alt: fc.string({ minLength: 1, maxLength: 10 }) }),
  ) as fc.Arbitrary<BlockType>;
}

describe("runPipeline — property-based tests", () => {
  // Feature: semantic-layout-engine, Property 14: Full pipeline determinism
  it("Property 14: two calls with same Block[] produce structurally equal SectionPage[] outputs", () => {
    fc.assert(
      fc.property(
        fc.array(arbPipelineBlock(), { minLength: 0, maxLength: 15 }),
        (blocks) => {
          const a = runPipeline(blocks, 1200);
          const b = runPipeline(blocks, 1200);
          expect(a).toEqual(b);
        },
      ),
      { numRuns: 100 },
    );
  });
});
