import { describe, expect, it } from "vitest";
import type { LayoutUnit } from "../../model/types";
import { paginate } from "../paginate";

const unit = (id: string, height: number): LayoutUnit => ({
  id,
  blocks: [
    {
      id: `${id}-b`,
      type: "paragraph",
      content: "x".repeat(Math.max(1, Math.round(height / 0.35))),
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
    const pages = paginate(units, 2, 500);
    expect(pages.length).toBeGreaterThanOrEqual(2);
  });

  it("is deterministic", () => {
    const units = [unit("a", 100), unit("b", 100)];
    const a = paginate(units, 3, 250);
    const b = paginate(units, 3, 250);
    expect(a).toEqual(b);
  });

  it("produces correct column count per page", () => {
    const units = [unit("x", 50), unit("y", 50), unit("z", 50)];
    const pages = paginate(units, 3, 800);
    expect(pages[0].columns).toHaveLength(3);
  });
});
