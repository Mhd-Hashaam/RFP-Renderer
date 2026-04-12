# Requirements Document

## Introduction

The Semantic Layout Engine replaces the current block-based, fixed 3-column pagination system with a section-based, intelligence-driven layout pipeline. Instead of treating every block equally and distributing them across a rigid grid, the new system groups blocks into semantic sections, classifies each section by its role and visual intent, and renders each section using a purpose-built template. Pages are generated dynamically from content rather than from a fixed column count. The sidebar is replaced by a Document Outline that tracks the active section via IntersectionObserver and supports click-to-scroll navigation.

---

## Glossary

- **Block**: The atomic unit of document content as defined in `types.ts` — one of `HeadingBlock`, `ParagraphBlock`, `ListBlock`, `ImageBlock`, or `GroupBlock`.
- **Section**: A logical grouping of one optional heading block and zero or more body blocks that follow it.
- **SectionFeatures**: A computed descriptor of a section's measurable properties (heading level, image count, paragraph count, list count, total text length, document position).
- **SectionRole**: A categorical label assigned to a section — one of `"hero"`, `"feature"`, `"gallery"`, or `"content"`.
- **SectionIntent**: A computed descriptor of a section's visual weight and layout preference — includes `emphasis`, `visualWeight`, and `layoutHint`.
- **ClassifiedSection**: A `Section` extended with `SectionRole`, `SectionIntent`, and `featureIndex`.
- **Pipeline**: The ordered sequence of pure functions that transforms `Block[]` into `ClassifiedSection[]` ready for rendering.
- **Intelligence Module**: The set of pure functions in `src/features/document/intelligence/` that implement the Pipeline.
- **SectionRenderer**: The React component that selects and renders the correct section template for a given `ClassifiedSection`.
- **HeroSection**: The section template used for the first section in the document.
- **FeatureSection**: The section template used for sections with at least one image and at least one paragraph (non-hero).
- **GallerySection**: The section template used for sections with three or more images.
- **ContentSection**: The section template used for text-only sections.
- **DocumentOutline**: The sidebar component that lists section headings, tracks the active section, and supports click-to-scroll.
- **DeviceCapability**: The signal produced by `useColumnCount` — one of `"mobile"`, `"tablet"`, or `"desktop"`.
- **featureIndex**: The zero-based position of a `ClassifiedSection` among all non-hero sections, used to alternate layout direction.
- **Page**: A visual container that holds one or more `ClassifiedSection`s rendered as a card.
- **DnD**: Drag-and-drop reordering of the canonical `Block[]` in the Zustand store.

---

## Requirements

### Requirement 1: Section Grouping

**User Story:** As a developer, I want blocks grouped into semantic sections, so that the layout engine can reason about content structure rather than individual blocks.

#### Acceptance Criteria

1. THE `groupIntoSections` function SHALL accept a `Block[]` and return a `Section[]`.
2. WHEN a `HeadingBlock` is encountered, THE `groupIntoSections` function SHALL start a new `Section` with that block as the section heading.
3. WHEN body blocks appear before the first heading, THE `groupIntoSections` function SHALL collect them into a `Section` with a `null` heading.
4. THE `groupIntoSections` function SHALL assign each `Section` a stable `id` derived from its heading block's `id`, or from the `id` of its first content block when the heading is `null`.
5. THE `groupIntoSections` function SHALL be a pure function — given the same `Block[]` input it SHALL always return the same `Section[]` output.
6. WHEN the input `Block[]` is empty, THE `groupIntoSections` function SHALL return an empty `Section[]`.

---

### Requirement 2: Section Feature Analysis

**User Story:** As a developer, I want each section's measurable properties computed into a `SectionFeatures` object, so that classification rules have a stable, typed input.

#### Acceptance Criteria

1. THE `analyzeSection` function SHALL accept a `Section` and its zero-based index within the full `Section[]`, and return a `SectionFeatures` object.
2. THE `analyzeSection` function SHALL set `headingLevel` to the heading block's `level` value, or `null` when the section has no heading.
3. THE `analyzeSection` function SHALL count all `ImageBlock` instances in `Section.content` and store the result in `imageCount`.
4. THE `analyzeSection` function SHALL count all `ParagraphBlock` instances in `Section.content` and store the result in `paragraphCount`.
5. THE `analyzeSection` function SHALL count all `ListBlock` instances in `Section.content` and store the result in `listCount`.
6. THE `analyzeSection` function SHALL sum the character length of all text content across heading, paragraphs, and list items and store the result in `totalTextLength`.
7. THE `analyzeSection` function SHALL set `documentPosition` to `"first"` when the section index is `0`, `"last"` when the section index equals the total section count minus one, and `"middle"` otherwise.
8. THE `analyzeSection` function SHALL be a pure function.

---

### Requirement 3: Section Classification

**User Story:** As a developer, I want each section assigned a `SectionRole` and `SectionIntent`, so that the renderer can select the correct template and visual weight without inspecting raw block data.

#### Acceptance Criteria

1. THE `classifySection` function SHALL accept a `Section` and its `SectionFeatures` and return a `ClassifiedSection`.
2. WHEN `SectionFeatures.documentPosition` is `"first"`, THE `classifySection` function SHALL assign `SectionRole` `"hero"` regardless of any other feature values.
3. WHEN `SectionFeatures.documentPosition` is not `"first"` AND `SectionFeatures.headingLevel` is `1`, THE `classifySection` function SHALL assign `SectionRole` `"feature"` (H1 downgrade rule).
4. WHEN `SectionFeatures.imageCount` is greater than or equal to `3` AND the section is not the first, THE `classifySection` function SHALL assign `SectionRole` `"gallery"`.
5. WHEN `SectionFeatures.imageCount` is greater than or equal to `1` AND `SectionFeatures.paragraphCount` is greater than or equal to `1` AND the section is not the first AND the section does not qualify as `"gallery"`, THE `classifySection` function SHALL assign `SectionRole` `"feature"`.
6. WHEN none of the above conditions apply, THE `classifySection` function SHALL assign `SectionRole` `"content"`.
7. THE `classifySection` function SHALL compute `SectionIntent.emphasis` as `"high"` for `"hero"`, `"medium"` for `"feature"` and `"gallery"`, and `"low"` for `"content"`.
8. THE `classifySection` function SHALL compute `SectionIntent.visualWeight` as an integer in the range `[1, 100]` derived from `imageCount`, `totalTextLength`, and `emphasis`.
9. THE `classifySection` function SHALL compute `SectionIntent.layoutHint` as `"wide"` for `"hero"`, `"balanced"` for `"feature"` and `"gallery"`, and `"compact"` for `"content"`.
10. THE `classifySection` function SHALL assign `featureIndex` as the zero-based count of non-hero sections that precede the current section in document order.
11. THE `classifySection` function SHALL be a pure function.
12. FOR ALL valid `Section` and `SectionFeatures` pairs, classifying then re-classifying with the same inputs SHALL produce an identical `ClassifiedSection` (idempotence).

---

### Requirement 4: Section Height Estimation

**User Story:** As a developer, I want a height estimate for each classified section, so that the pagination engine can distribute sections across pages without rendering them.

#### Acceptance Criteria

1. THE `estimateSectionHeight` function SHALL accept a `ClassifiedSection` and return a positive integer representing the estimated height in pixels.
2. THE `estimateSectionHeight` function SHALL add a fixed per-image height contribution for each `ImageBlock` in the section.
3. THE `estimateSectionHeight` function SHALL add a per-character height contribution for `totalTextLength`.
4. THE `estimateSectionHeight` function SHALL add a fixed heading height contribution when the section has a heading.
5. THE `estimateSectionHeight` function SHALL return a minimum height of `1` for any non-empty section.
6. THE `estimateSectionHeight` function SHALL be a pure function.

---

### Requirement 5: Section-Based Pagination

**User Story:** As a developer, I want sections distributed across pages dynamically, so that page count is driven by content volume rather than a fixed column grid.

#### Acceptance Criteria

1. THE `paginateSections` function SHALL accept a `ClassifiedSection[]` and a page content height in pixels, and return a `Page[]` where each `Page` contains an ordered list of `ClassifiedSection`s.
2. WHEN a section's estimated height exceeds the remaining space on the current page AND the current page already contains at least one section, THE `paginateSections` function SHALL start a new page.
3. WHEN a section's estimated height exceeds the full page content height, THE `paginateSections` function SHALL place that section alone on its own page.
4. THE `paginateSections` function SHALL never produce an empty page.
5. THE `paginateSections` function SHALL preserve the original document order of sections across all pages.
6. THE `paginateSections` function SHALL be a pure function.
7. FOR ALL non-empty `ClassifiedSection[]` inputs, the union of all sections across all output pages SHALL equal the input array (no sections lost or duplicated).

---

### Requirement 6: Section Template — HeroSection

**User Story:** As a reader, I want the first section rendered with maximum visual prominence, so that the document's primary subject is immediately clear.

#### Acceptance Criteria

1. THE `HeroSection` component SHALL render the section heading using `text-5xl` typography on desktop.
2. WHEN `DeviceCapability` is `"desktop"` or `"tablet"`, THE `HeroSection` component SHALL use a `grid-cols-3` layout with text occupying two columns and the first image occupying one column.
3. WHEN `DeviceCapability` is `"mobile"`, THE `HeroSection` component SHALL stack text and image in a single column.
4. WHEN the section contains no image, THE `HeroSection` component SHALL render the text content full-width.
5. THE `HeroSection` component SHALL apply `mb-16` spacing after the section.

---

### Requirement 7: Section Template — FeatureSection

**User Story:** As a reader, I want feature sections to alternate image-left and image-right layouts, so that the document has visual rhythm and avoids monotony.

#### Acceptance Criteria

1. WHEN `ClassifiedSection.featureIndex` is even, THE `FeatureSection` component SHALL render the image in the left column and text in the right column.
2. WHEN `ClassifiedSection.featureIndex` is odd, THE `FeatureSection` component SHALL render the image in the right column and text in the left column.
3. WHEN `DeviceCapability` is `"desktop"` or `"tablet"`, THE `FeatureSection` component SHALL use a `grid-cols-2` layout.
4. WHEN `DeviceCapability` is `"mobile"`, THE `FeatureSection` component SHALL collapse to a single column with image above text.
5. THE `FeatureSection` component SHALL apply `mb-16` spacing after the section.

---

### Requirement 8: Section Template — GallerySection

**User Story:** As a reader, I want image-heavy sections rendered as a gallery, so that multiple images are presented in a visually coherent grid rather than stacked vertically.

#### Acceptance Criteria

1. THE `GallerySection` component SHALL render the section heading full-width above the image grid.
2. WHEN the section contains exactly `2` images, THE `GallerySection` component SHALL render them side by side in a 50/50 split.
3. WHEN the section contains exactly `3` images, THE `GallerySection` component SHALL render the first image spanning two columns and the remaining two images in a single column.
4. WHEN the section contains `4` or more images, THE `GallerySection` component SHALL render them in a uniform `grid-cols-2` grid.
5. THE `GallerySection` component SHALL render each image's `caption` below the image in `text-zinc-500 text-xs italic` typography when a caption is present.
6. THE `GallerySection` component SHALL apply `mb-16` spacing after the section.

---

### Requirement 9: Section Template — ContentSection

**User Story:** As a reader, I want text-only sections rendered in a readable single-column prose layout, so that long-form content is easy to scan.

#### Acceptance Criteria

1. THE `ContentSection` component SHALL render all content blocks in a single column with a `max-width` prose constraint.
2. THE `ContentSection` component SHALL apply `mb-6` spacing between consecutive blocks within the section.
3. THE `ContentSection` component SHALL apply `mb-16` spacing after the section.

---

### Requirement 10: SectionRenderer Dispatch

**User Story:** As a developer, I want a single entry-point component that selects the correct section template, so that page rendering code does not contain template-selection logic.

#### Acceptance Criteria

1. THE `SectionRenderer` component SHALL accept a `ClassifiedSection` and a `DeviceCapability` value as props.
2. WHEN `ClassifiedSection.role` is `"hero"`, THE `SectionRenderer` component SHALL render `HeroSection`.
3. WHEN `ClassifiedSection.role` is `"feature"`, THE `SectionRenderer` component SHALL render `FeatureSection`.
4. WHEN `ClassifiedSection.role` is `"gallery"`, THE `SectionRenderer` component SHALL render `GallerySection`.
5. WHEN `ClassifiedSection.role` is `"content"`, THE `SectionRenderer` component SHALL render `ContentSection`.
6. THE `SectionRenderer` component SHALL pass all required props to the selected template component without modification.

---

### Requirement 11: Document Outline Sidebar

**User Story:** As a reader, I want the sidebar to show only section headings with active-section tracking, so that I can navigate the document without being distracted by raw block metadata.

#### Acceptance Criteria

1. THE `DocumentOutline` component SHALL render one entry per section that has a non-null heading.
2. THE `DocumentOutline` component SHALL use `IntersectionObserver` to detect which section is currently visible in the viewport and mark it as active.
3. WHEN a heading entry is clicked, THE `DocumentOutline` component SHALL scroll the corresponding section into view using smooth scrolling.
4. THE `DocumentOutline` component SHALL apply a visually distinct style to the active heading entry.
5. THE `DocumentOutline` component SHALL use `overflow-y-auto scrollbar-none` to handle overflow without showing a scrollbar.
6. THE `DocumentOutline` component SHALL NOT render block-type badges or block-count labels.
7. WHEN the document contains no headings, THE `DocumentOutline` component SHALL render an empty state message.

---

### Requirement 12: Device Capability Signal

**User Story:** As a developer, I want `useColumnCount` repurposed as a device capability signal, so that section templates can adapt their layout without coupling to a numeric column count.

#### Acceptance Criteria

1. THE `useColumnCount` hook SHALL return one of the string literals `"mobile"`, `"tablet"`, or `"desktop"` instead of a numeric column count.
2. WHEN the viewport width is less than `768px`, THE `useColumnCount` hook SHALL return `"mobile"`.
3. WHEN the viewport width is between `768px` and `1279px` inclusive, THE `useColumnCount` hook SHALL return `"tablet"`.
4. WHEN the viewport width is `1280px` or greater, THE `useColumnCount` hook SHALL return `"desktop"`.
5. THE `useColumnCount` hook SHALL update the returned value when the viewport is resized.

---

### Requirement 13: Dark Theme Visual System

**User Story:** As a reader, I want the dark theme to use a Vercel-style near-black background with zinc-toned cards, so that the document feels modern and high-contrast.

#### Acceptance Criteria

1. WHEN the active theme is dark, THE `DocumentApp` component SHALL apply `bg-[#0a0a0a]` as the root background color.
2. WHEN the active theme is dark, THE Page card component SHALL apply `bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl` styles.
3. WHEN the active theme is dark, THE heading elements SHALL use `text-zinc-100` color.
4. WHEN the active theme is dark, THE body text elements SHALL use `text-zinc-400` color.
5. WHEN the active theme is dark, THE caption elements SHALL use `text-zinc-500 text-xs italic` styles.
6. WHEN the active theme is dark, THE background image SHALL NOT be rendered.

---

### Requirement 14: DnD Reorder Integration

**User Story:** As a user, I want drag-and-drop reordering to continue working after the layout engine is replaced, so that I can rearrange document sections without losing that capability.

#### Acceptance Criteria

1. THE `DocumentApp` component SHALL continue to expose drag-and-drop reordering on the canonical `Block[]` in the Zustand store.
2. WHEN blocks are reordered via DnD, THE Pipeline SHALL re-derive `Section[]` and `ClassifiedSection[]` from the updated `Block[]` on the next render.
3. THE `DocumentOutline` component SHALL reflect the updated section order after a DnD reorder without requiring a page reload.
4. THE DnD reorder control SHALL be accessible from the toolbar as a mode toggle, separate from the `DocumentOutline`.

---

### Requirement 15: Pipeline Determinism and Testability

**User Story:** As a developer, I want every Intelligence Module function to be pure and deterministic, so that the pipeline can be unit-tested and property-tested without mocks or side effects.

#### Acceptance Criteria

1. THE `groupIntoSections` function SHALL produce identical output for identical input on every invocation.
2. THE `analyzeSection` function SHALL produce identical output for identical input on every invocation.
3. THE `classifySection` function SHALL produce identical output for identical input on every invocation.
4. THE `estimateSectionHeight` function SHALL produce identical output for identical input on every invocation.
5. THE `paginateSections` function SHALL produce identical output for identical input on every invocation.
6. FOR ALL valid `Block[]` inputs, running the full Pipeline twice SHALL produce structurally equal `ClassifiedSection[]` outputs (round-trip determinism).
7. THE Intelligence Module functions SHALL have no dependency on React, browser APIs, or external services.

---

### Requirement 16: Backward Compatibility of Preserved Modules

**User Story:** As a developer, I want the modules explicitly marked as unchanged to remain unmodified, so that existing functionality and tests are not broken by the layout engine replacement.

#### Acceptance Criteria

1. THE `Block` union type in `types.ts` SHALL remain structurally compatible with all existing consumers after new types are added.
2. THE `useDocumentStore` hook SHALL continue to expose `blocks`, `setBlocks`, `reorderBlocks`, `moveBlock`, `updateHeading`, `updateParagraph`, and `updateListItem` with unchanged signatures.
3. THE `normalize` module SHALL continue to accept `RawBlockInput[]` and return `Block[]` with unchanged behavior.
4. THE `EditableText` component SHALL continue to function without modification.
5. THE `exportPdfFromElement` function SHALL continue to function without modification.
6. THE `ThemeProvider` and `ThemeToggle` components SHALL continue to function without modification.
7. WHEN the existing test suite is run after the layout engine replacement, THE test runner SHALL report zero regressions in previously passing tests.
