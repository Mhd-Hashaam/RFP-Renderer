import { describe, expect, it } from "vitest";
import { buildLayoutUnits } from "../buildLayoutUnits";
import type { Block } from "../../model/types";

const h = (id: string, content: string) =>
  ({
    id,
    type: "heading",
    level: 2 as const,
    content,
  }) satisfies Block;

const p = (id: string, content: string) =>
  ({
    id,
    type: "paragraph",
    content,
  }) satisfies Block;

const list = (id: string) =>
  ({
    id,
    type: "list",
    style: "unordered" as const,
    items: ["a"],
  }) satisfies Block;

const img = (id: string) =>
  ({
    id,
    type: "image",
    src: "/x.png",
    alt: "x",
  }) satisfies Block;

const grp = (id: string) =>
  ({
    id,
    type: "group",
    children: [p(`${id}-c`, "nested")],
  }) satisfies Block;

describe("buildLayoutUnits", () => {
  it("pairs heading + paragraph", () => {
    const blocks = [h("1", "Title"), p("2", "Body")];
    const units = buildLayoutUnits(blocks);
    expect(units).toHaveLength(1);
    expect(units[0].id).toBe("unit:1");
    expect(units[0].blocks.map((b) => b.id)).toEqual(["1", "2"]);
  });

  it("pairs heading + list / image / group", () => {
    expect(buildLayoutUnits([h("a", "A"), list("b")])[0].blocks).toHaveLength(
      2,
    );
    expect(buildLayoutUnits([h("a", "A"), img("b")])[0].blocks).toHaveLength(
      2,
    );
    expect(buildLayoutUnits([h("a", "A"), grp("b")])[0].blocks).toHaveLength(
      2,
    );
  });

  it("does not pair two headings", () => {
    const units = buildLayoutUnits([h("1", "A"), h("2", "B"), p("3", "C")]);
    expect(units).toHaveLength(2);
    expect(units[0].blocks).toHaveLength(1);
    expect(units[0].blocks[0].id).toBe("1");
    expect(units[1].id).toBe("unit:2");
    expect(units[1].blocks.map((b) => b.id)).toEqual(["2", "3"]);
  });

  it("handles heading at end alone", () => {
    const units = buildLayoutUnits([h("1", "Lonely")]);
    expect(units).toHaveLength(1);
    expect(units[0].blocks).toHaveLength(1);
  });

  it("handles leading paragraph", () => {
    const units = buildLayoutUnits([p("1", "Intro"), h("2", "H")]);
    expect(units[0].blocks[0].id).toBe("1");
    expect(units[1].blocks).toHaveLength(1);
  });
});
