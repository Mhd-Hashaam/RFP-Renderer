# Approach (submission summary)

This project implements a **dynamic RFP-style document renderer** in Next.js with TypeScript. Content is loaded from structured JSON, normalized with stable IDs, and rendered through a single `BlockRenderer` switch to keep the system easy to extend.

The hardest product requirement—**multi-column pagination without splitting headings from their first body block**—is handled by deriving **layout units** before pagination. A heading pairs with the next block only when that block is an explicitly allowlisted **body** type (`paragraph`, `list`, `image`, or `group`). Pagination operates on layout units, not raw blocks, which keeps the layout deterministic and makes the behavior testable as pure functions.

Heights are **estimated** rather than measured in the DOM for v1. This trades some visual accuracy for speed, simplicity, and predictable CI behavior. PDF export intentionally targets the **rendered DOM** so the exported artifact matches what the user sees, at the cost of rasterization fidelity compared to vector PDF engines.

Given more time, the next improvements would be: DOM-informed height measurement for tighter pagination, better multi-page PDF stitching strategies, and stronger column balancing across the page.
