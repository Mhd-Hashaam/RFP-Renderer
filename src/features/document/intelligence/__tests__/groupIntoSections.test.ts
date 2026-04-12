import { describe, expect, it } from "vitest";
import { groupIntoSections } from "../groupIntoSections";
import type { Block } from "../../model/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const h = (id: string, content = "Heading", level: 1 | 2 | 3 = 2): Block => ({
  id,
  type: "heading",
  level,
  content,
});

const p = (id: string, content = "Paragraph"): Block => ({
  id,
  type: "paragraph",
  content,
});

const img = (id: string): Block => ({
  id,
  type: "image",
  src: "/img.webp",
  alt: "image",
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("groupIntoSections", () => {
  it("returns empty array for empty input", () => {
    expect(groupIntoSections([])).toEqual([]);
  });

  it("single heading with no body produces one section", () => {
    const sections = groupIntoSections([h("h1")]);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading?.id).toBe("h1");
    expect(sections[0].content).toHaveLength(0);
    expect(sections[0].id).toBe("h1");
  });

  it("heading followed by body blocks groups them together", () => {
    const sections = groupIntoSections([h("h1"), p("p1"), p("p2")]);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading?.id).toBe("h1");
    expect(sections[0].content).toHaveLength(2);
  });

  it("body blocks before first heading go into a null-heading section", () => {
    const sections = groupIntoSections([p("p0"), h("h1"), p("p1")]);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content[0].id).toBe("p0");
    expect(sections[0].id).toBe("p0");
    expect(sections[1].heading?.id).toBe("h1");
  });

  it("multiple headings produce multiple sections", () => {
    const blocks: Block[] = [h("h1"), p("p1"), h("h2"), p("p2"), h("h3")];
    const sections = groupIntoSections(blocks);
    expect(sections).toHaveLength(3);
    expect(sections[0].heading?.id).toBe("h1");
    expect(sections[1].heading?.id).toBe("h2");
    expect(sections[2].heading?.id).toBe("h3");
  });

  it("section id equals heading.id when heading is present", () => {
    const sections = groupIntoSections([h("heading-abc"), p("p1")]);
    expect(sections[0].id).toBe("heading-abc");
  });

  it("section id equals first content block id when heading is null", () => {
    const sections = groupIntoSections([p("first-block"), p("second-block")]);
    expect(sections[0].id).toBe("first-block");
    expect(sections[0].heading).toBeNull();
  });

  it("preserves block order within each section", () => {
    const blocks: Block[] = [h("h1"), p("p1"), img("i1"), p("p2")];
    const sections = groupIntoSections(blocks);
    expect(sections[0].content.map((b) => b.id)).toEqual(["p1", "i1", "p2"]);
  });

  it("all blocks are accounted for across sections", () => {
    const blocks: Block[] = [p("p0"), h("h1"), p("p1"), img("i1"), h("h2"), p("p2")];
    const sections = groupIntoSections(blocks);
    const allBlocks = sections.flatMap((s) =>
      s.heading ? [s.heading, ...s.content] : s.content,
    );
    expect(allBlocks.map((b) => b.id)).toEqual(blocks.map((b) => b.id));
  });

  it("only body blocks produce a single null-heading section", () => {
    const sections = groupIntoSections([p("p1"), p("p2"), img("i1")]);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].content).toHaveLength(3);
  });
});

// ─── Arbitraries ─────────────────────────────────────────────────────────────

import * as fc from "fast-check";
import type { Block as BlockType } from "../../model/types";

/** Generates a random Block across all five subtypes with unique-ish ids. */
function arbBlock(): fc.Arbitrary<BlockType> {
  return fc.oneof(
    fc.record({
      id: fc.uuid(),
      type: fc.constant("heading" as const),
      level: fc.constantFrom(1 as const, 2 as const, 3 as const),
      content: fc.string({ minLength: 1, maxLength: 40 }),
    }),
    fc.record({
      id: fc.uuid(),
      type: fc.constant("paragraph" as const),
      content: fc.string({ minLength: 1, maxLength: 100 }),
    }),
    fc.record({
      id: fc.uuid(),
      type: fc.constant("list" as const),
      style: fc.constantFrom("ordered" as const, "unordered" as const),
      items: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
    }),
    fc.record({
      id: fc.uuid(),
      type: fc.constant("image" as const),
      src: fc.constant("/img.webp"),
      alt: fc.string({ minLength: 1, maxLength: 20 }),
      caption: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
    }),
    fc.record({
      id: fc.uuid(),
      type: fc.constant("group" as const),
      children: fc.array(
        fc.record({
          id: fc.uuid(),
          type: fc.constant("paragraph" as const),
          content: fc.string({ minLength: 1, maxLength: 30 }),
        }),
        { minLength: 0, maxLength: 3 },
      ),
    }),
  ) as fc.Arbitrary<BlockType>;
}

/** Generates a random Block[] of length 0–20. */
function arbBlockArray(): fc.Arbitrary<BlockType[]> {
  return fc.array(arbBlock(), { minLength: 0, maxLength: 20 });
}

// ─── Property-based tests ─────────────────────────────────────────────────────

describe("groupIntoSections — property-based tests", () => {
  // Feature: semantic-layout-engine, Property 1: Section grouping covers all blocks
  it("Property 1: union of all section blocks equals input array (same elements, same order)", () => {
    fc.assert(
      fc.property(arbBlockArray(), (blocks) => {
        const sections = groupIntoSections(blocks);
        const outputBlocks = sections.flatMap((s) =>
          s.heading ? [s.heading, ...s.content] : s.content,
        );
        expect(outputBlocks.map((b) => b.id)).toEqual(blocks.map((b) => b.id));
      }),
      { numRuns: 100 },
    );
  });

  // Feature: semantic-layout-engine, Property 2: Section id derivation
  it("Property 2: every section id equals heading.id or content[0].id", () => {
    fc.assert(
      fc.property(arbBlockArray(), (blocks) => {
        const sections = groupIntoSections(blocks);
        for (const section of sections) {
          if (section.heading !== null) {
            expect(section.id).toBe(section.heading.id);
          } else if (section.content.length > 0) {
            expect(section.id).toBe(section.content[0].id);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: semantic-layout-engine, Property 3: groupIntoSections determinism
  it("Property 3: two calls with same input produce structurally equal output", () => {
    fc.assert(
      fc.property(arbBlockArray(), (blocks) => {
        const a = groupIntoSections(blocks);
        const b = groupIntoSections(blocks);
        expect(a).toEqual(b);
      }),
      { numRuns: 100 },
    );
  });
});
