import { describe, expect, it } from "vitest";
import type { LayoutUnit } from "../../model/types";
import { paginate } from "../paginate";

const unit = (id: string, height: number): LayoutUnit => ({
  id,
  blocks: [
    {
      id: `${id}-b`,
      type: "paragraph",
      content: "x".repeat(Math.max(1, Math.round(height))),
    },
  ],
});

describe("paginate", () => {
  it("fills columns sequentially then starts a new page", () => {
    const units: LayoutUnit[] = [
      unit("u1", 300),
      unit("u2", 300),
      unit("u3", 300),
      unit("u4", 300),
    ];
    const estimate = () => 300;
    const pages = paginate(units, 2, 500, estimate);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages[0].columns[0]).toHaveLength(1);
    expect(pages[0].columns[1]).toHaveLength(1);
  });

  it("is deterministic", () => {
    const units = [unit("a", 100), unit("b", 100)];
    const estimate = () => 100;
    const a = paginate(units, 3, 250, estimate);
    const b = paginate(units, 3, 250, estimate);
    expect(a).toEqual(b);
  });
});
