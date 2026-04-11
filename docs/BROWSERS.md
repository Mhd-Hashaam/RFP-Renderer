# Browser support & responsiveness

## Target browsers

Manual testing is expected on the latest **Chrome**, **Firefox**, and **Safari** (current and previous major versions).

## Responsive layout

The document uses a responsive column count:

- **≤639px**: 1 column
- **≤1023px**: 2 columns
- **≥1024px**: 3 columns

The page “sheet” uses a max width container so line lengths stay readable on ultra-wide displays.

## Known limitations

- **PDF export** rasterizes the DOM; very tall documents may produce large PDFs and can be sensitive to cross-origin image loading (remote images should allow CORS where possible).
- **Drag-and-drop** is optimized for pointer devices; on narrow screens the outline exposes **move up / move down** controls as a fallback.

## Motion

`@dnd-kit` respects common accessibility patterns; users with `prefers-reduced-motion` may still see transform animations depending on OS/browser settings.
