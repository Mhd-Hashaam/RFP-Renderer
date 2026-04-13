# Dynamic RFP Section Renderer

A semantic, data-driven document renderer built with React and TypeScript.

## Overview

This project renders structured JSON into a professional, multi-page RFP-style document with rich content support, dynamic layouts, inline editing, and PDF export.

Unlike traditional renderers, this system introduces a **semantic layout engine** that interprets content before rendering — grouping blocks into sections, classifying each section's role, and selecting the appropriate layout template automatically.

---

## Features

### Core Rendering
- Dynamic rendering from structured JSON data
- Rich block support: headings, paragraphs, lists, images, groups, and metadata grids
- Semantic section detection and classification (`hero`, `feature`, `gallery`, `content`)
- Intelligent layout selection per section role
- Multi-page document flow with section-aware pagination

### Editing
- Inline editing for all text content (headings, paragraphs, list items)
- Save / Cancel controls with keyboard support (`Enter` to save, `Escape` to cancel)
- Full undo / redo history (up to 50 states) with `Ctrl+Z` / `Ctrl+Y`
- Undo/redo buttons appear in the toolbar only after the first edit

### Organisation
- Drag-and-drop section reordering (sections move as atomic units — heading + content together)
- Drag-and-drop list item reordering within any list block
- Hover-reveal grip handles on list items

### Navigation & UI
- Sidebar document outline with IntersectionObserver-based active section tracking
- Smooth scroll-to-section on outline click
- Responsive sidebar: overlay on tablet/mobile (< 1024px), push layout on desktop
- Open/close toggle inside the sidebar header
- Dark / light theme with GSAP ripple transition, hydration-safe

### Scroll
- Lenis smooth scrolling with momentum-based easing
- Custom spring elastic bounce at scroll boundaries

### Export (Optional)
- PDF export via `@react-pdf/renderer` — real vector PDF with selectable text
- WebP → JPEG conversion pipeline (WebP is unsupported by the PDF renderer)
- Natural image aspect ratios preserved in PDF output
- Known limitation: fixed A4 pages produce blank space on shorter pages — a fundamental constraint of the format, not a bug

---

## Architecture

```
JSON → Normalize → Section Builder → Semantic Analysis → Layout Engine → Render → Pagination
```

### Pipeline Stages

| Stage | Description |
|---|---|
| **Normalize** | Assigns stable IDs, validates block types |
| **Section Builder** | Groups blocks into sections by heading |
| **Semantic Analysis** | Extracts features (heading level, image count, text density, position) |
| **Classification** | Assigns role: `hero`, `feature`, `gallery`, `content` |
| **Layout Engine** | Selects template per role, computes visual intent |
| **Pagination** | Splits sections into pages using estimated heights |
| **Render** | React components per section role |

### Block Types

| Type | Description |
|---|---|
| `heading` | H1–H3 with level-aware styling |
| `paragraph` | Body text, inline editable |
| `list` | Ordered or unordered, items draggable |
| `image` | Natural aspect ratio, caption support |
| `group` | Nested block container |
| `meta` | Key/value metadata grid (e.g. client, location, type) |

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR, file-based routing, image optimisation |
| Language | TypeScript | Exhaustive type safety across the pipeline |
| Styling | Tailwind CSS v4 | Utility-first, semantic token support |
| Components | shadcn/ui | Accessible, unstyled base components |
| State | Zustand | Minimal, selector-based, no boilerplate |
| Drag & Drop | @dnd-kit | Accessible, headless, composable |
| PDF | @react-pdf/renderer | Real vector PDF, selectable text |
| Smooth Scroll | Lenis | Momentum-based, performant, composable |
| Animations | GSAP | Theme ripple transition |
| Testing | Vitest + Testing Library | Fast, ESM-native |

---

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other Commands

```bash
npm run typecheck   # TypeScript type check
npm run lint        # ESLint
npm run test        # Run test suite (85 tests)
npm run build       # Production build
```

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — no configuration needed
4. Click **Deploy**

The `vercel.json` in the root configures:
- **Region**: `iad1` (US East) for low latency
- **Asset caching**: `/Assets/*` and `/_next/static/*` cached for 1 year (immutable)
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`

### CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

```
lint → typecheck → test → build
```

All checks must pass before merging.

---

## Assumptions

- The JSON schema is the source of truth. The renderer adapts to the data — no hardcoded section counts or content assumptions.
- The first section with a level-1 heading is always classified as `hero`. Subsequent sections are classified based on their content signals.
- Images are served from `/Assets/` in the `public` directory. The PDF export fetches them at runtime and converts WebP to JPEG.
- The `meta` block type is an extension to the original schema, added to solve content density in the hero section. It renders as a 2-column key/value grid.
- PDF blank space on shorter pages is accepted as an industry-standard behaviour of fixed-size page formats.

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
├── components/
│   ├── providers/                # Lenis smooth scroll provider
│   ├── theme/                    # Theme provider + toggle
│   └── ui/                       # shadcn/ui base components
├── features/document/
│   ├── components/
│   │   ├── blocks/               # Block renderers (heading, paragraph, list, image, meta)
│   │   ├── dnd/                  # Drag-and-drop section reorder
│   │   ├── editor/               # Inline editable text
│   │   ├── export/               # PDF export pipeline
│   │   └── sections/             # Section layout templates
│   ├── intelligence/             # Semantic analysis pipeline
│   ├── layout/                   # Height estimation
│   └── model/                    # Types, constants, normaliser, mock data
└── store/                        # Zustand document store with undo/redo
```
