# RFP Section Renderer

A **dynamic RFP-style document renderer** built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**. It loads structured JSON, renders rich mixed content (headings, paragraphs, lists, images, nested groups), paginates into responsive multi-column “pages,” supports **inline editing**, **drag-and-drop reordering**, and **PDF export** (DOM capture).

**Submission repository**: `https://github.com/Mhd-Hashaam/RFP-Renderer`

## Quick start

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Other scripts

| Script        | Description                   |
| ------------- | ----------------------------- |
| `npm run dev` | Start the dev server          |
| `npm run build` | Production build            |
| `npm run start` | Start production server     |
| `npm run lint` | ESLint                        |
| `npm run typecheck` | `tsc --noEmit`            |
| `npm run test` | Vitest (layout unit tests)    |

## What I built (one paragraph)

A schema-driven document viewer that normalizes JSON blocks, derives **layout units** to keep headings attached to their first body block, paginates those units into responsive columns with a fixed page content budget, and wires edits + reordering back to a single canonical Zustand `Block[]`. PDF export rasterizes the **rendered DOM** for WYSIWYG-ish parity with the on-screen layout.

## Architecture (keywords)

- **Schema-driven UI** via `BlockRenderer`
- **Layout units** (`buildLayoutUnits`) + **pure pagination** (`paginate`)
- **Deterministic** layout functions (easy to test and debug)
- **Canonical store** for order + edits; derived layout after every change

Read more in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Trade-offs

- **Estimated heights** instead of DOM measurement (faster/simpler; not pixel-perfect).
- **Raster PDF** via `html2canvas` + `jspdf` (good visual parity; weaker text selection vs vector PDF).

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/CI.md](docs/CI.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/BROWSERS.md](docs/BROWSERS.md)
- [docs/APPROACH.md](docs/APPROACH.md)
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md)

## Tech stack versions

Pinned in `package.json` after scaffolding (example: Next `16.x`, React `19.x`). Use `.nvmrc` for Node alignment in CI and Vercel.

Note: the `shadcn` package is kept as a **devDependency** so Tailwind can resolve `@import "shadcn/tailwind.css"` from `globals.css` (required by the shadcn v4 + Tailwind v4 template).
