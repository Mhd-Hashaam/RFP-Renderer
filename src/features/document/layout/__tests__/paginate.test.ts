import { describe, expect, it } from "vitest";
import type { LayoutUnit } from "../../model/types";
import { paginate } from "../paginate";

const unit = (id: string, height: number): LayoutUnit => ({
  id,
  blocks: [
    {
      id: `${id}-b`,
      type: "paragraph",
      // estimateBlockHeightPx for paragraph: max(52, min(520, 40 + len * 0.42))
      // To get ~height px: len = (height - 40) / 0.42
      content: "x".repeat(Math.max(1, Math.round(Math.max(0, height - 40) / 0.42))),
    },
  ],
});

describe("paginate", () => {
  it("fills columns sequentially then starts a new page", () => {
    // Each unit ≈ 300px. With 1 column and 400px budget:
    // u1(300) fits, u2(300) doesn't → new page. Guaranteed 2+ pages.
    const units: LayoutUnit[] = [
      unit("u1", 300),
      unit("u2", 300),
      unit("u3", 300),
    ];
    const pages = paginate(units, 1, 400);
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
