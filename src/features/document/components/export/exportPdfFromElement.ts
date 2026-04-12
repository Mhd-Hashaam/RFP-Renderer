import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Captures a single HTMLElement using html2canvas.
 * Scrolls the element into view first so the browser has fully painted it,
 * then captures at full scroll dimensions (not just the visible viewport).
 */
async function captureElement(
  el: HTMLElement,
  bgColor: string,
): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  el.scrollIntoView({ block: "nearest" });
  // Two rAFs: first lets the DOM update, second lets the browser paint
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: bgColor,
    logging: false,
    height: el.scrollHeight,
    width: el.scrollWidth,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    widthPx: canvas.width,
    heightPx: canvas.height,
  };
}

/**
 * Exports the document as a multi-page PDF.
 *
 * Strategy: capture each page card (article[data-page-card]) individually
 * using html2canvas on the live DOM. This avoids all overflow/clipping issues
 * because each card is fully rendered in the document flow.
 *
 * - First PDF page is sized to the first card's content height (no blank space).
 * - Each subsequent card gets its own PDF page sized to its content.
 * - Cards taller than A4 are sliced into multiple A4 pages.
 */
export async function exportPdfFromElement(
  container: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#0a0a0a" : "#d2cfc7";

  const pageCards = Array.from(
    container.querySelectorAll<HTMLElement>("article[data-page-card]"),
  );

  const targets: HTMLElement[] = pageCards.length > 0 ? pageCards : [container];

  // Capture all cards sequentially
  const captures: Array<{ dataUrl: string; widthPx: number; heightPx: number }> = [];
  for (const card of targets) {
    captures.push(await captureElement(card, bgColor));
  }

  if (captures.length === 0) return;

  // ── Build PDF ──────────────────────────────────────────────────────────

  // First page: sized to first card's content height
  const first = captures[0];
  const firstImgH = (first.heightPx / first.widthPx) * A4_WIDTH_MM;
  const firstPageH = Math.min(firstImgH, A4_HEIGHT_MM);

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: [A4_WIDTH_MM, firstPageH],
  });

  pdf.addImage(first.dataUrl, "PNG", 0, 0, A4_WIDTH_MM, firstImgH);

  // Remaining cards
  for (let i = 1; i < captures.length; i++) {
    const { dataUrl, widthPx, heightPx } = captures[i];
    const imgH = (heightPx / widthPx) * A4_WIDTH_MM;

    if (imgH <= A4_HEIGHT_MM) {
      // Card fits on one page — size the page to the card
      pdf.addPage([A4_WIDTH_MM, imgH]);
      pdf.addImage(dataUrl, "PNG", 0, 0, A4_WIDTH_MM, imgH);
    } else {
      // Card taller than A4 — slice into A4 pages
      let remaining = imgH;
      let yOffset = 0;
      let firstSlice = true;

      while (remaining > 0) {
        const sliceH = Math.min(remaining, A4_HEIGHT_MM);
        if (firstSlice) {
          pdf.addPage([A4_WIDTH_MM, sliceH]);
        } else {
          if (sliceH < A4_HEIGHT_MM) pdf.addPage([A4_WIDTH_MM, sliceH]);
          else pdf.addPage();
        }
        pdf.addImage(dataUrl, "PNG", 0, -yOffset, A4_WIDTH_MM, imgH);
        yOffset += sliceH;
        remaining -= sliceH;
        firstSlice = false;
      }
    }
  }

  pdf.save(fileName);
}
