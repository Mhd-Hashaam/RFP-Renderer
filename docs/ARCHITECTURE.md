# Architecture

## Overview

This application renders a **schema-driven** “Project scope” document from structured JSON. The UI is split into three layers:

1. **Model** — TypeScript discriminated unions (`Block`) plus normalization (stable IDs).
2. **Layout** — Pure functions that derive **layout units** and **pages** from the canonical block list.
3. **Presentation** — React components (`BlockRenderer`, `Page`, `Column`) plus inline editing and export.

## Data flow

```text
mock JSON
  → normalizeBlocks (assign ids)
  → Zustand store (canonical Block[] order)
  → buildLayoutUnits (heading + body grouping)
  → paginate (column + page buckets)
  → DocumentRenderer / Page / Column / LayoutUnit
```

**PDF export** captures the **rendered DOM** subtree (`ref` around the paginated document) via `html2canvas` + `jspdf`.

**Drag-and-drop** updates only the **canonical** `Block[]` in the store. **Layout units are always recomputed** after reordering so heading/body grouping stays correct.

## Layout engine principles

- The layout system operates on **layout units** rather than raw blocks. This abstraction ensures semantic grouping (e.g., heading + body) and prevents visually incorrect pagination artifacts.
- The layout engine is **deterministic** given the same input data (same canonical block order and content), which ensures predictable pagination and consistent rendering across edits and reorders—important for debugging, PDF consistency, and UX stability.
- Layout logic is tested as **pure functions** independent of React, ensuring deterministic and fast validation of pagination and grouping behavior.

## Heading + body grouping

`BODY_TYPES` is an explicit allowlist (`paragraph`, `list`, `image`, `group`). A `heading` is paired with the **next** block only when `isBodyBlock(next)` is true. Otherwise the heading becomes its own atomic layout unit.

This is **not** the same concept as a JSON `group` block:

- **`group` blocks** are authored nested content in the document model.
- **Layout units** are synthetic buckets used only for pagination.

## Pagination strategy

`paginate` fills **columns sequentially** (column 0, then 1, …) until the configured page content height is exceeded, then advances to the next page. Heights are **estimated** with deterministic heuristics (`estimateHeight.ts`) for performance and simplicity.

## PDF export

PDF export operates on the **rendered DOM** rather than the data model to ensure **visual parity** with the user-facing document.

## Trade-offs (current)

- **Estimated heights** are faster than measuring DOM nodes, but can diverge from true rendered heights for unusual fonts/wrapping.
- **Raster PDF** via `html2canvas` is straightforward but is not vector-perfect for text selection.

## Future improvements

- DOM-measured layout (or hybrid) for tighter pagination.
- Vector PDF generation (e.g. dedicated PDF layout toolkit).
- Stronger column balancing across pages.
