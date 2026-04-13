# Mindset & Approach

## Phase 1 — Naive Implementation

I started by directly mapping the provided JSON to UI components using a simple block renderer (heading, paragraph, list, image).

At this stage:
- Content was rendered sequentially
- A fixed 3-column layout was applied
- Pagination was handled using height thresholds

### Problems Observed

This approach quickly exposed major issues:

- ❌ No visual hierarchy — all sections looked equally important
- ❌ Images felt like thumbnails, not meaningful content
- ❌ Layout felt mechanical, not intentional
- ❌ Columns were arbitrary and broke semantic flow
- ❌ Sidebar added noise without real value

Most importantly, the UI did not resemble a professional RFP document.

---

## Phase 2 — Realisation

I realised the core problem:

> The system was rendering *data*, not *meaning*.

A real document is not just blocks — it has hierarchy, intent, and narrative flow. So instead of improving the UI manually, I shifted the problem:

> How can the system *understand* the document before rendering it?

---

## Phase 3 — Semantic Transformation Layer

I introduced an intermediate intelligence layer:

```
blocks → sections → semantic analysis → layout decisions → render
```

### Key Decisions

- Group blocks into **sections** (based on headings)
- Extract features per section:
  - heading level
  - image count
  - text density
  - document position
- Assign **semantic roles**:
  - `hero` — first section, dominant image, large typography
  - `feature` — alternating image/text split layout
  - `gallery` — structured multi-image grid
  - `content` — compact readable prose

This allowed the UI to be **data-driven but meaningful** — the layout emerges from the content, not from hardcoded rules.

---

## Phase 4 — Layout System Redesign

Instead of forcing everything into a global grid:

- Each **section controls its own layout**
- Layout is chosen based on its semantic role

Examples:
- Hero → 5-column grid, large heading with tight tracking, editorial image offset
- Feature → alternating 50/50 split, image position driven by `featureIndex`
- Gallery → responsive image grid with special 3-image layout
- Content → max-prose width, relaxed line height

This made the document feel intentional rather than generated.

---

## Phase 5 — Pagination Rethink

Initially, pagination was block-based. This caused headings to separate from their content and broke reading flow.

Solution:
- Pagination happens **after section layout**
- Sections are treated as atomic layout units
- Pages are generated dynamically using estimated section heights
- The same pipeline drives both the web renderer and the PDF export

---

## Phase 6 — Schema Extension

The original schema (heading, paragraph, list, image, group) was extended with a `meta` block type — a structured key/value grid for project metadata (client, location, building type, etc.).

This solved a real content density problem in the hero section: instead of artificially stretching text or adding filler, the meta block fills space with **meaningful information** that mirrors how real RFP documents present project details.

The normaliser, block renderer, reorder panel, PDF parser, and height estimator were all updated to handle the new type exhaustively.

---

## Phase 7 — Interactive Features

Beyond rendering, the system became a full editing environment:

- **Inline editing** — every heading, paragraph, and list item is editable via `contentEditable` with save/cancel controls
- **Undo / Redo** — full history stack (up to 50 states) with `Ctrl+Z` / `Ctrl+Y` keyboard shortcuts; buttons appear only after the first edit
- **Section reordering** — drag-and-drop via `@dnd-kit`, operating on semantic sections (not raw blocks), so heading + content always move together
- **List item reordering** — individual list items are also draggable with a hover-reveal grip handle
- **Document outline** — sidebar with IntersectionObserver-based active section tracking and smooth scroll-to-section
- **Responsive sidebar** — overlay on tablet/mobile (< 1024px), push layout on desktop; open/close toggle lives inside the sidebar header
- **Theme toggle** — dark/light with a GSAP ripple transition, hydration-safe (SSR renders dark, client syncs from localStorage)
- **Smooth scrolling** — Lenis with momentum-based easing and a custom spring elastic bounce at scroll boundaries

---

## Phase 8 — PDF Export (Optional Feature)

PDF export was implemented as an optional enhancement using `@react-pdf/renderer`, which generates real vector PDFs with selectable text — a significant improvement over screenshot-based approaches like `html2canvas`.

### Problems Encountered

**WebP support**: `@react-pdf/renderer` does not support WebP images. All images had to be converted to JPEG via an HTML5 Canvas pipeline before being passed to the PDF renderer. Large images (some over 4MB) were resized to a maximum of 1200px width during conversion to prevent memory spikes.

**Natural aspect ratios**: The PDF renderer requires explicit dimensions. The image loader was extended to capture `naturalWidth` and `naturalHeight` during the canvas conversion, storing a computed `aspectRatio` alongside the data URL. This allowed PDF images to render at their true proportions rather than hardcoded 16:9 or 4:3 ratios.

**Pagination and blank space**: This is the known limitation we accepted. `@react-pdf/renderer` uses fixed A4 page dimensions (595pt × 842pt). It does not support `height: auto` pages or dynamic page sizing. When a section's content is shorter than a full page, the remaining space is blank — this is identical behaviour to Google Docs, Notion exports, and Microsoft Word. We matched the web app's 5-page pagination exactly, but the blank space at the bottom of shorter pages is a fundamental constraint of the A4 format, not a bug.

We did not pursue further research into eliminating blank space because:
1. PDF export was an **optional feature** in the brief
2. The only real solution would be a completely different rendering approach (e.g., a custom layout engine that calculates exact content heights before page breaks), which would require significant additional time
3. The current output is functionally correct and professionally acceptable

---

## Phase 9 — Quality & Polish

- Full TypeScript coverage with exhaustive `never` checks on all block type switches
- ESLint clean (0 errors, 0 warnings)
- 85 passing tests across 9 test files
- Semantic CSS tokens throughout — no hardcoded dark colours, full light/dark theme support
- Custom scrollbar (grey thumb on transparent track, adapts per theme)
- `prefers-reduced-motion` respected in both Lenis and the elastic bounce

---

## What I'd Improve With More Time

- **PDF blank space**: Research a custom page-break algorithm that calculates exact rendered heights and splits content at natural boundaries, eliminating excess whitespace
- **Richer mock data**: The current dataset is a single Gothic architecture RFP. A more diverse dataset — multiple document types, varying content densities, different image ratios — would stress-test the semantic classification and layout engine more rigorously
- **ML-assisted layout decisions**: Replace heuristic scoring (heading level + image count + text density) with a lightweight model trained on real document layouts
- **Collaborative editing**: Multi-user presence with conflict resolution
- **Design system theming**: Allow users to switch between document themes (minimal, editorial, corporate) without changing the underlying data
- **Accessibility audit**: Full keyboard navigation, screen reader testing, WCAG compliance review

---

## Closing Thought

This project evolved from:

> "Render JSON into UI"

to:

> "Build an intelligent document rendering system that understands what it's displaying"

The most important decision was treating the layout engine as a first-class concern — not an afterthought. Everything else followed from that.
