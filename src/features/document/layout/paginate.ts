import type { LayoutUnit, PageLayout } from "../model/types";

export type EstimateUnit = (unit: LayoutUnit) => number;

/**
 * Sequential column fill: fill column 0, then 1, … then next page.
 * Deterministic for the same units, column count, and budget.
 */
export function paginate(
  units: LayoutUnit[],
  columnCount: number,
  pageContentHeightPx: number,
  estimateUnit: EstimateUnit,
): PageLayout[] {
  if (columnCount < 1) {
    throw new Error("columnCount must be at least 1");
  }

  const pages: PageLayout[] = [];
  let columns: LayoutUnit[][] = Array.from({ length: columnCount }, () => []);
  let colIndex = 0;
  let heightInCol = 0;

  const hasAnyContent = (cols: LayoutUnit[][]) =>
    cols.some((c) => c.length > 0);

  const commitPage = () => {
    if (hasAnyContent(columns)) {
      pages.push({ columns });
    }
    columns = Array.from({ length: columnCount }, () => []);
    colIndex = 0;
    heightInCol = 0;
  };

  for (const unit of units) {
    const h = estimateUnit(unit);

    while (true) {
      const emptyColumn = heightInCol === 0;
      const fits = heightInCol + h <= pageContentHeightPx;
      const forceOversizedIntoEmptyColumn = emptyColumn && h > pageContentHeightPx;

      if (fits || forceOversizedIntoEmptyColumn) {
        columns[colIndex].push(unit);
        heightInCol += h;
        break;
      }

      colIndex += 1;
      if (colIndex >= columnCount) {
        commitPage();
      } else {
        heightInCol = 0;
      }
    }
  }

  commitPage();

  return pages.filter((p) => hasAnyContent(p.columns));
}
