import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Temporarily removes minHeight constraints so the captured image
 * reflects actual content height, not the padded layout height.
 */
function stripMinHeights(root: HTMLElement): () => void {
  const els = Array.from(
    root.querySelectorAll<HTMLElement>("[data-page-grid]"),
  );
  const originals = els.map((el) => el.style.minHeight);
  els.forEach((el) => (el.style.minHeight = "0px"));
  return () => els.forEach((el, i) => (el.style.minHeight = originals[i]));
}

/**
 * Industry-standard approach: capture the full DOM as one image, then create
 * a PDF whose page dimensions exactly match the image — no slicing, no blank
 * trailing space. For very long documents a second pass slices by A4 height.
 *
 * Strategy:
 *  - If content fits within one A4 page height → single page sized to content.
 *  - If content is taller → slice into A4 pages using the correct negative-y
 *    offset technique, with the last page sized to the remaining content height
 *    so there is zero blank space.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#18181b" : "#ffffff";

  const restoreMinHeights = stripMinHeights(element);

  let dataUrl: string;
  let naturalWidth: number;
  let naturalHeight: number;

  try {
    dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: bgColor,
      skipFonts: false,
    });

    // Resolve image dimensions without adding to DOM
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  } finally {
    restoreMinHeights();
  }

  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // Scale factor: image width → A4 width in mm
  const imgWidthMm = A4_WIDTH_MM;
  const imgHeightMm = (naturalHeight! / naturalWidth!) * imgWidthMm;

  if (imgHeightMm <= A4_HEIGHT_MM) {
    // ── Single page: make the PDF exactly as tall as the content ──────────
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: [A4_WIDTH_MM, imgHeightMm],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(fileName);
    return;
  }

  // ── Multi-page: slice the image into A4-height chunks ─────────────────
  // Each page renders the full image at a negative y-offset so the correct
  // slice is visible. The LAST page is sized to the remaining content height
  // so there is no blank space at the bottom.
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  let remainingHeight = imgHeightMm;
  let yOffset = 0; // how far down the image we've consumed (mm)
  let isFirstPage = true;

  while (remainingHeight > 0) {
    const sliceHeight = Math.min(remainingHeight, A4_HEIGHT_MM);
    const isLastPage = sliceHeight < A4_HEIGHT_MM;

    if (!isFirstPage) {
      if (isLastPage) {
        // Add a page exactly as tall as the remaining content — no blank space
        pdf.addPage([A4_WIDTH_MM, sliceHeight]);
      } else {
        pdf.addPage();
      }
    }

    // Place the full image at -yOffset so the correct slice is visible
    pdf.addImage(dataUrl, "PNG", 0, -yOffset, imgWidthMm, imgHeightMm);

    yOffset += sliceHeight;
    remainingHeight -= sliceHeight;
    isFirstPage = false;
  }

  pdf.save(fileName);
}
