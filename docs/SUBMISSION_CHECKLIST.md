# Submission checklist (last-day)

1. **Core**: `npm install` and `npm run dev` works; no crash on load; JSON renders; pagination works; 3-column layout on large screens; responsive fallback (1–2 columns) behaves sensibly.
2. **Differentiators**: Heading + body grouping; no orphaned heading split from its first body; layout units remain coherent after edits.
3. **Inline editing**: Updates persist in state; no obvious flicker; headings, paragraphs, and list items; **edit → paginate** still looks sane.
4. **Drag & drop**: Reordering updates immediately; pagination recomputes; no duplicate/missing blocks; **no index-based React keys** for blocks/units.
5. **PDF export**: Button works; output readable; multi-page export does not crash (imperfection is OK if documented).
6. **Console hygiene**: No red errors; avoid React key warnings.
7. **TypeScript / ESLint**: `npm run typecheck` and `npm run lint` are clean.
8. **UI polish**: Consistent spacing; typographic hierarchy; clear separation between workspace background and document “pages”.
9. **Performance**: No obvious infinite render loops; typing stays responsive.
10. **README**: Setup, what you built, architecture keywords, trade-offs, improvements.
11. **Git hygiene**: `.env` not committed; `.gitignore` sensible; meaningful commits (optional).
12. **Final 10 minutes**: Fresh `npm install` + `npm run dev`; click through edit, reorder, export.

Common pitfalls: broken install, console errors, layout regressions after edits, index keys, weak README.
