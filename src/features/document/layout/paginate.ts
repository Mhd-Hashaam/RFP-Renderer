import type { LayoutUnit, PageLayout } from "../model/types";
import { estimateLayoutUnitHeightPx, unitHasImage } from "./estimateHeight";

/**
 * Column-aware pagination engine.
 *
 * Rules:
 * 1. Track height per column independently.
 * 2. If a unit doesn't fit the current column → advance to next column.
 * 3. If all columns on the current page are full → start a new page.
 * 4. Oversized units (taller than full page) are forced into an empty column.
 * 5. Image units: if current column is >70% full, push to next column to
 *    avoid images being squeezed at the bottom.
 * 6. After each page is committed, run a simple column balancing pass to
 *    prevent one column being dramatically taller than others.
 */
export function paginate(
  units: LayoutUnit[],
  columnCount: number,
  pageContentHeightPx: number,
): PageLayout[] {
  if (columnCount < 1) throw new Error("columnCount must be at least 1");

  const pages: PageLayout[] = [];

  let columns: LayoutUnit[][] = Array.from({ length: columnCount }, () => []);
  let colHeights: number[] = Array(columnCount).fill(0);
  let colIndex = 0;

  const commitPage = () => {
    const balanced = balanceColumns(columns, colHeights, columnCount);
    if (balanced.some((c) => c.length > 0)) {
      pages.push({ columns: balanced });
    }
    columns = Array.from({ length: columnCount }, () => []);
    colHeights = Array(columnCount).fill(0);
    colIndex = 0;
  };

  const advanceColumn = () => {
    colIndex += 1;
    if (colIndex >= columnCount) {
      commitPage();
    }
  };

  for (const unit of units) {
    const h = estimateLayoutUnitHeightPx(unit);
    const hasImg = unitHasImage(unit);

    // Rule 5: image near bottom of column → push to next
    if (hasImg && colHeights[colIndex] > pageContentHeightPx * 0.7) {
      advanceColumn();
    }

    // Rule 2 + 3: doesn't fit → advance
    const isEmpty = colHeights[colIndex] === 0;
    const fits = colHeights[colIndex] + h <= pageContentHeightPx;
    const oversized = h > pageContentHeightPx;

    if (!fits && !(isEmpty && oversized)) {
      advanceColumn();
    }

    // After possible advance, force oversized into current empty column
    columns[colIndex].push(unit);
    colHeights[colIndex] += h;
  }

  commitPage();

  return pages.filter((p) => p.columns.some((c) => c.length > 0));
}

/**
 * Simple column balancing: if the tallest column is >200px taller than the
 * shortest, move the last unit from the tallest to the shortest.
 * Runs once per page — keeps it O(n) and deterministic.
 */
function balanceColumns(
  columns: LayoutUnit[][],
  heights: number[],
  columnCount: number,
): LayoutUnit[][] {
  const result = columns.map((col) => [...col]);
  const h = [...heights];

  for (let pass = 0; pass < 2; pass++) {
    const max = Math.max(...h);
    const min = Math.min(...h);
    if (max - min <= 200) break;

    const from = h.indexOf(max);
    const to = h.indexOf(min);

    // Only move if source has more than 1 unit (don't empty a column)
    if (result[from].length <= 1) break;

    const moved = result[from].pop()!;
    const movedH = estimateLayoutUnitHeightPx(moved);
    h[from] -= movedH;

    result[to].push(moved);
    h[to] += movedH;
  }

  // Ensure we always return exactly columnCount columns
  while (result.length < columnCount) result.push([]);

  return result;
}
