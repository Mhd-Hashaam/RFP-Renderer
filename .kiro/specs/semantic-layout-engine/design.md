# Design Document — Semantic Layout Engine

## Overview

The Semantic Layout Engine replaces the current fixed 3-column `buildLayoutUnits → paginate` pipeline with a section-aware, intelligence-driven rendering pipeline. The core insight is that document content has semantic structure — headings introduce topics, images illustrate them, lists enumerate them — and the renderer should exploit that structure to produce visually purposeful layouts rather than mechanically distributing blocks across a grid.

### What Changes

| Area | Before | After |
|---|---|---|
| Layout unit | `LayoutUnit` (heading + one body block) | `ClassifiedSection` (heading + all following body blocks) |
| Column count | `number` (1/2/3) | `DeviceCapability` (`"mobile"` / `"tablet"` / `"desktop"`) |
| Pagination | Column-aware grid fill | Section-aware vertical stacking |
| Renderer | `DocumentRenderer` → `Page` → `Column` → `LayoutUnit` | `DocumentRenderer` → `Page` → `SectionRenderer` → template |
| Sidebar | `SortableOutline` (block list) | `DocumentOutline` (section headings + IntersectionObserver) |
| Intelligence | Inline in `DocumentRenderer` | Pure functions in `intelligence/` |

### What Stays

- `Block` union type and all block subtypes in `types.ts`
- `useDocumentStore` with all existing action signatures
- `normalize` module
- `EditableText` component
- `exportPdfFromElement`
- `ThemeProvider` / `ThemeToggle`
- `buildLayoutUnits`, `paginate`, `estimateHeight` (kept for backward compat, no longer in main render path)
- `SortableOutline` (moved out of sidebar, accessible via toolbar toggle)
- All existing tests continue to pass

---

## Architecture

### Pipeline Overview

```
Block[]  (Zustand store)
   │
   ▼
groupIntoSections()          → Section[]
   │
   ▼
analyzeSection() × N         → SectionFeatures[] (one per section)
   │
   ▼
classifySection() × N        → ClassifiedSection[]
   │
   ▼
paginateSections()           → Page[]  (each Page holds ClassifiedSection[])
   │
   ▼
DocumentRenderer             renders Page[] as React cards
   │
   ▼
Page → SectionRenderer × N  dispatches to template per ClassifiedSection.role
   │
   ├── HeroSection
   ├── FeatureSection
   ├── GallerySection
   └── ContentSection
```

All steps from `groupIntoSections` through `paginateSections` are pure TypeScript functions with no React or browser dependencies. They live in `src/features/document/intelligence/`.

### Folder Structure

```
src/features/document/
├── intelligence/                        ← NEW: pure pipeline functions
│   ├── groupIntoSections.ts
│   ├── analyzeSection.ts
│   ├── classifySection.ts
│   ├── estimateSectionHeight.ts
│   ├── paginateSections.ts
│   ├── pipeline.ts                      ← runPipeline() convenience export
│   └── __tests__/
│       ├── groupIntoSections.test.ts
│       ├── analyzeSection.test.ts
│       ├── classifySection.test.ts
│       ├── estimateSectionHeight.test.ts
│       ├── paginateSections.test.ts
│       └── pipeline.test.ts
├── components/
│   ├── sections/                        ← NEW: section template components
│   │   ├── HeroSection.tsx
│   │   ├── FeatureSection.tsx
│   │   ├── GallerySection.tsx
│   │   ├── ContentSection.tsx
│   │   └── SectionRenderer.tsx
│   ├── sidebar/                         ← NEW: DocumentOutline
│   │   └── DocumentOutline.tsx
│   ├── blocks/                          ← UNCHANGED
│   ├── dnd/                             ← UNCHANGED (SortableOutline stays)
│   ├── editor/                          ← UNCHANGED
│   ├── export/                          ← UNCHANGED
│   ├── BlockRenderer.tsx                ← UNCHANGED
│   ├── DocumentApp.tsx                  ← MODIFIED (wires new pipeline + sidebar)
│   ├── DocumentRenderer.tsx             ← REPLACED (runs pipeline, renders pages)
│   ├── Page.tsx                         ← MODIFIED (renders ClassifiedSection[] not columns)
│   ├── Column.tsx                       ← UNCHANGED (still used by old path)
│   └── LayoutUnit.tsx                   ← UNCHANGED
├── hooks/
│   └── useColumnCount.ts                ← MODIFIED (returns DeviceCapability)
├── layout/                              ← UNCHANGED (backward compat)
│   ├── buildLayoutUnits.ts
│   ├── estimateHeight.ts
│   ├── paginate.ts
│   └── measureHeights.ts
└── model/
    ├── types.ts                         ← EXTENDED (new types added)
    ├── constants.ts                     ← EXTENDED (new constants added)
    ├── normalize.ts                     ← UNCHANGED
    └── mock-data.json                   ← UNCHANGED
```

---

## Components and Interfaces

### Intelligence Module

#### `groupIntoSections.ts`

```typescript
export function groupIntoSections(blocks: Block[]): Section[]
```

Iterates `blocks` linearly. When a `HeadingBlock` is encountered, commits the current accumulator as a section and starts a new one with that heading. Body blocks before the first heading accumulate into a section with `heading: null`. The section `id` is `heading.id` when a heading exists, otherwise the `id` of the first content block.

#### `analyzeSection.ts`

```typescript
export function analyzeSection(
  section: Section,
  index: number,
  total: number,
): SectionFeatures
```

Counts block types in `section.content`, sums text lengths, and derives `documentPosition` from `index` and `total`.

#### `classifySection.ts`

```typescript
export function classifySection(
  section: Section,
  features: SectionFeatures,
  featureIndex: number,
): ClassifiedSection
```

Applies the role decision tree (hero → gallery → feature → content), computes `SectionIntent`, and attaches `featureIndex`.

#### `estimateSectionHeight.ts`

```typescript
export function estimateSectionHeight(section: ClassifiedSection): number
```

Returns a pixel estimate used by `paginateSections`. Pure, no DOM access.

#### `paginateSections.ts`

```typescript
export function paginateSections(
  sections: ClassifiedSection[],
  pageContentHeightPx: number,
): SectionPage[]
```

Distributes sections across pages. A section that does not fit the current page starts a new page. An oversized section gets its own page.

#### `pipeline.ts`

```typescript
export function runPipeline(
  blocks: Block[],
  pageContentHeightPx: number,
): SectionPage[]
```

Convenience function that chains all five steps. Used by `DocumentRenderer`.

---

### Section Template Components

All templates receive `section: ClassifiedSection` and `device: DeviceCapability`. They use `BlockRenderer` internally for individual blocks.

#### `SectionRenderer.tsx`

Dispatches to the correct template based on `section.role`. No layout logic of its own.

```typescript
type Props = {
  section: ClassifiedSection;
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};
```

#### `HeroSection.tsx`

- Desktop/tablet: `grid-cols-3`, text in cols 1–2, first image in col 3
- Mobile: single column, text above image
- No image: full-width text
- Heading: `text-5xl font-bold`
- Spacing: `mb-16`

#### `FeatureSection.tsx`

- Desktop/tablet: `grid-cols-2`
- Even `featureIndex`: image left, text right
- Odd `featureIndex`: text left, image right
- Mobile: single column, image above text
- Spacing: `mb-16`

#### `GallerySection.tsx`

- Heading full-width above grid
- 2 images: `grid-cols-2` 50/50
- 3 images: first image `col-span-2`, remaining two in `grid-cols-2`
- 4+ images: uniform `grid-cols-2`
- Captions: `text-zinc-500 text-xs italic`
- Spacing: `mb-16`

#### `ContentSection.tsx`

- Single column, `max-w-prose`
- `mb-6` between blocks
- `mb-16` after section

---

### Sidebar Component

#### `DocumentOutline.tsx`

```typescript
type Props = {
  sections: ClassifiedSection[];
};
```

- Renders one `<button>` per section with a non-null heading
- Uses `IntersectionObserver` on section DOM nodes (identified by `data-section-id` attribute) to track the active section
- Click scrolls the target section into view with `behavior: "smooth"`
- Active entry: `text-white font-semibold` with a left accent bar
- Inactive entry: `text-white/50 hover:text-white/80`
- Container: `overflow-y-auto scrollbar-none`
- Empty state: `<p className="text-white/30 text-xs px-3">No headings</p>`
- No block-type badges, no block-count labels

---

### Modified Components

#### `useColumnCount.ts`

```typescript
export type DeviceCapability = "mobile" | "tablet" | "desktop";
export function useColumnCount(): DeviceCapability
```

Breakpoints:
- `< 768px` → `"mobile"`
- `768px – 1279px` → `"tablet"`
- `≥ 1280px` → `"desktop"`

Uses `window.matchMedia` with `change` event listeners. SSR-safe default: `"desktop"`.

#### `DocumentRenderer.tsx`

Replaces the old column-grid renderer. Runs `runPipeline(blocks, PAGE_CONTENT_HEIGHT_PX)` inside `useMemo`, then renders a `<Page>` per `SectionPage`.

```typescript
type Props = {
  blocks: Block[];
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};
```

#### `Page.tsx`

Receives `sections: ClassifiedSection[]` instead of `columns: LayoutUnit[][]`. Renders a `<SectionRenderer>` per section inside the card shell. Applies dark-theme card styles: `bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl`.

#### `DocumentApp.tsx`

- Passes `device` (from `useColumnCount`) to `DocumentRenderer`
- Replaces `SortableOutline` in sidebar with `DocumentOutline`
- Adds a toolbar toggle button that opens a modal/drawer containing `SortableOutline` for DnD reordering
- Passes `sections` (derived from `runPipeline`) to `DocumentOutline`
- Root background: `bg-[#0a0a0a]` in dark mode

---

## Data Models

### New Types (added to `types.ts`)

```typescript
export type DeviceCapability = "mobile" | "tablet" | "desktop";

export type DocumentPosition = "first" | "middle" | "last";

export type SectionRole = "hero" | "feature" | "gallery" | "content";

export type SectionEmphasis = "high" | "medium" | "low";

export type LayoutHint = "wide" | "balanced" | "compact";

export type SectionIntent = {
  emphasis: SectionEmphasis;
  visualWeight: number;   // integer in [1, 100]
  layoutHint: LayoutHint;
};

export type Section = {
  id: string;
  heading: HeadingBlock | null;
  content: Block[];
};

export type SectionFeatures = {
  headingLevel: HeadingLevel | null;
  imageCount: number;
  paragraphCount: number;
  listCount: number;
  totalTextLength: number;
  documentPosition: DocumentPosition;
};

export type ClassifiedSection = Section & {
  role: SectionRole;
  intent: SectionIntent;
  featureIndex: number;
};

export type SectionPage = {
  sections: ClassifiedSection[];
};
```

### Existing Types (unchanged)

`Block`, `HeadingBlock`, `ParagraphBlock`, `ListBlock`, `ImageBlock`, `GroupBlock`, `LayoutUnit`, `PageLayout`, `RawBlockInput` — all remain structurally identical.

### Classification Decision Tree

```
documentPosition === "first"
  └─ role = "hero"

documentPosition !== "first" AND headingLevel === 1
  └─ role = "feature"  (H1 downgrade)

imageCount >= 3
  └─ role = "gallery"

imageCount >= 1 AND paragraphCount >= 1
  └─ role = "feature"

otherwise
  └─ role = "content"
```

### SectionIntent Mapping

| Role | emphasis | layoutHint | visualWeight formula |
|---|---|---|---|
| `"hero"` | `"high"` | `"wide"` | `min(100, 60 + imageCount * 10 + totalTextLength / 100)` |
| `"feature"` | `"medium"` | `"balanced"` | `min(100, 40 + imageCount * 10 + totalTextLength / 150)` |
| `"gallery"` | `"medium"` | `"balanced"` | `min(100, 30 + imageCount * 15)` |
| `"content"` | `"low"` | `"compact"` | `min(100, 10 + totalTextLength / 200)` |

All `visualWeight` values are clamped to `[1, 100]` and rounded to the nearest integer.

### Height Estimation Constants (added to `constants.ts`)

```typescript
export const SECTION_PAGE_CONTENT_HEIGHT_PX = 1200;
export const SECTION_HEIGHT_PER_IMAGE_PX = 280;
export const SECTION_HEIGHT_PER_CHAR_PX = 0.3;
export const SECTION_HEIGHT_HEADING_PX = 80;
export const SECTION_HEIGHT_MIN_PX = 1;
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Section grouping covers all blocks

*For any* `Block[]`, the union of all blocks across all sections returned by `groupIntoSections` SHALL equal the input array — no blocks are lost or duplicated, and order is preserved.

**Validates: Requirements 1.1, 1.2, 1.3, 15.1**

---

### Property 2: Section id derivation

*For any* `Block[]`, every `Section` in the output of `groupIntoSections` SHALL have an `id` equal to `section.heading.id` when a heading is present, or equal to the `id` of the first element of `section.content` when `heading` is `null`.

**Validates: Requirements 1.4**

---

### Property 3: groupIntoSections determinism

*For any* `Block[]`, calling `groupIntoSections` twice with the same input SHALL produce structurally equal `Section[]` outputs.

**Validates: Requirements 1.5, 15.1**

---

### Property 4: analyzeSection feature counts are accurate

*For any* `Section`, the `SectionFeatures` returned by `analyzeSection` SHALL have `imageCount`, `paragraphCount`, and `listCount` equal to the actual counts of those block types in `section.content`, and `totalTextLength` equal to the sum of character lengths of all text content in the section.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**

---

### Property 5: documentPosition is correctly assigned

*For any* `Section[]` of length `n > 0`, the section at index `0` SHALL have `documentPosition === "first"`, the section at index `n - 1` SHALL have `documentPosition === "last"`, and all sections at indices `1` through `n - 2` SHALL have `documentPosition === "middle"`.

**Validates: Requirements 2.7**

---

### Property 6: Hero role is always assigned to the first section

*For any* `Section[]`, the `ClassifiedSection` produced for the section at index `0` SHALL always have `role === "hero"`, regardless of its content.

**Validates: Requirements 3.2**

---

### Property 7: Classification rules are mutually consistent

*For any* non-first `Section` and its `SectionFeatures`, the assigned `SectionRole` SHALL satisfy exactly one of: `"gallery"` (imageCount ≥ 3), `"feature"` (headingLevel === 1 OR (imageCount ≥ 1 AND paragraphCount ≥ 1 AND imageCount < 3)), or `"content"` (all other cases). The `SectionIntent` fields SHALL match the role mapping table: `emphasis` is `"high"` for hero, `"medium"` for feature/gallery, `"low"` for content; `layoutHint` is `"wide"` for hero, `"balanced"` for feature/gallery, `"compact"` for content; `visualWeight` is an integer in `[1, 100]`.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

---

### Property 8: featureIndex increments monotonically for non-hero sections

*For any* `ClassifiedSection[]`, the `featureIndex` values of non-hero sections SHALL form the sequence `0, 1, 2, ...` in document order.

**Validates: Requirements 3.10**

---

### Property 9: classifySection is idempotent

*For any* `Section` and `SectionFeatures`, calling `classifySection` twice with the same inputs SHALL produce structurally equal `ClassifiedSection` outputs.

**Validates: Requirements 3.12, 15.3**

---

### Property 10: estimateSectionHeight is always positive

*For any* `ClassifiedSection` with at least one block, `estimateSectionHeight` SHALL return a value ≥ 1.

**Validates: Requirements 4.1, 4.5**

---

### Property 11: estimateSectionHeight is monotone with content

*For any* `ClassifiedSection` A and B where B is identical to A except that B has one additional `ImageBlock` in its content, `estimateSectionHeight(B)` SHALL be strictly greater than `estimateSectionHeight(A)`.

**Validates: Requirements 4.2, 4.3, 4.4**

---

### Property 12: Pagination preserves all sections

*For any* non-empty `ClassifiedSection[]` and page height, the ordered concatenation of all `sections` arrays across all `SectionPage[]` returned by `paginateSections` SHALL equal the input array exactly (same elements, same order, no duplicates, no omissions).

**Validates: Requirements 5.5, 5.7**

---

### Property 13: No empty pages

*For any* non-empty `ClassifiedSection[]` and page height, every `SectionPage` in the output of `paginateSections` SHALL contain at least one section.

**Validates: Requirements 5.4**

---

### Property 14: Full pipeline determinism

*For any* `Block[]`, calling `runPipeline` twice with the same input SHALL produce structurally equal `SectionPage[]` outputs.

**Validates: Requirements 15.6**

---

## Error Handling

### Pure Function Errors

- `groupIntoSections([])` → returns `[]` (no throw)
- `paginateSections([], h)` → returns `[]` (no throw)
- `estimateSectionHeight` on a section with no blocks → returns `SECTION_HEIGHT_MIN_PX` (1)
- `classifySection` with an unrecognized role path → falls through to `"content"` (exhaustive switch with `never` guard)

### Component Errors

- `DocumentOutline` with no headings → renders empty state message, no crash
- `SectionRenderer` with an unknown `role` → TypeScript exhaustive check; runtime fallback renders `ContentSection`
- `useColumnCount` during SSR → returns `"desktop"` as safe default (no `window` access on server)

### Type Safety

- No `any` types anywhere in the new code
- All switch statements over discriminated unions use `never` exhaustive guards
- `visualWeight` is clamped with `Math.max(1, Math.min(100, Math.round(raw)))` to guarantee the `[1, 100]` invariant

---

## Testing Strategy

### Unit Tests (Vitest)

All pure functions in `intelligence/` have co-located unit tests in `intelligence/__tests__/`. Tests cover:

- Empty input edge cases
- Single-element inputs
- Boundary conditions (exactly 3 images for gallery, featureIndex alternation)
- The specific classification rules from Requirements 3.2–3.6

### Property-Based Tests (Vitest + fast-check)

Property-based tests are written using [fast-check](https://github.com/dubzzz/fast-check), which generates hundreds of random inputs per test run. Each test is configured with `{ numRuns: 100 }` minimum.

Each property test is tagged with a comment in the format:
`// Feature: semantic-layout-engine, Property N: <property_text>`

Properties 1–14 above each map to one property-based test. The test file is `intelligence/__tests__/pipeline.test.ts` for end-to-end properties and individual function test files for function-level properties.

**fast-check arbitraries needed:**
- `arbBlock()` — generates random `Block` values across all five subtypes
- `arbBlockArray()` — generates `Block[]` of length 0–20
- `arbSection()` — generates `Section` with random heading and content
- `arbSectionFeatures()` — generates valid `SectionFeatures`
- `arbClassifiedSection()` — generates `ClassifiedSection`

### Component Tests

Section template components (`HeroSection`, `FeatureSection`, `GallerySection`, `ContentSection`) are tested with example-based Vitest + React Testing Library tests verifying:

- Correct grid class applied for each `DeviceCapability`
- `featureIndex` even/odd layout direction for `FeatureSection`
- Gallery grid variants for 2, 3, and 4+ images
- Caption rendering when present/absent
- `mb-16` spacing class present

### Regression Guard

The existing tests in `layout/__tests__/buildLayoutUnits.test.ts` and `layout/__tests__/paginate.test.ts` must continue to pass without modification. The `layout/` folder is not touched.

### Build Verification

After each implementation phase: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build`
