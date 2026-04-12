import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Capture width in px — matches a standard A4 document at 96dpi
const CAPTURE_WIDTH_PX = 1240;

/**
 * Prepares the element for full-document capture:
 * - Fixes the element width to CAPTURE_WIDTH_PX so the PDF isn't clipped
 * - Removes overflow constraints on ancestor scroll containers so all
 *   content is rendered (not just the visible viewport)
 *
 * Returns a cleanup function that restores all original styles.
 */
function prepareForCapture(root: HTMLElement): () => void {
  const restorers: Array<() => void> = [];

  // 1. Fix the capture element's width so it matches A4 proportions
  const origWidth = root.style.width;
  const origMaxWidth = root.style.maxWidth;
  root.style.width = `${CAPTURE_WIDTH_PX}px`;
  root.style.maxWidth = `${CAPTURE_WIDTH_PX}px`;
  restorers.push(() => {
    root.style.width = origWidth;
    root.style.maxWidth = origMaxWidth;
  });

  // 2. Walk up the DOM and remove overflow:hidden / overflow:auto / overflow:scroll
  //    on all ancestors so html-to-image can see the full content height
  let el: HTMLElement | null = root.parentElement;
  while (el && el !== document.body) {
    const cs = window.getComputedStyle(el);
    const overflowY = cs.overflowY;
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "hidden") {
      const orig = el.style.overflowY;
      const origHeight = el.style.height;
      const origMaxHeight = el.style.maxHeight;
      el.style.overflowY = "visible";
      el.style.height = "auto";
      el.style.maxHeight = "none";
      const captured = el; // capture for closure
      const origOY = orig;
      const origH = origHeight;
      const origMH = origMaxHeight;
      restorers.push(() => {
        captured.style.overflowY = origOY;
        captured.style.height = origH;
        captured.style.maxHeight = origMH;
      });
    }
    el = el.parentElement;
  }

  return () => restorers.forEach((r) => r());
}

/**
 * Exports the full document as a multi-page PDF.
 *
 * Fixes two common problems:
 * 1. Content clipped on the right — solved by fixing capture width to A4 proportions.
 * 2. Only visible viewport captured — solved by removing overflow constraints before capture.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#0a0a0a" : "#d2cfc7";

  const restore = prepareForCapture(element);

  let dataUrl: string;
  let naturalWidth: number;
  let naturalHeight: number;

  try {
    dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: bgColor,
      skipFonts: false,
      width: CAPTURE_WIDTH_PX,
    });

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
    restore();
  }

  const imgWidthMm = A4_WIDTH_MM;
  const imgHeightMm = (naturalHeight! / naturalWidth!) * imgWidthMm;

  if (imgHeightMm <= A4_HEIGHT_MM) {
    // Single page — size the PDF exactly to the content height
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: [A4_WIDTH_MM, imgHeightMm],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(fileName);
    return;
  }

  // Multi-page — slice into A4 chunks; last page sized to remaining content
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  let remainingHeight = imgHeightMm;
  let yOffset = 0;
  let isFirstPage = true;

  while (remainingHeight > 0) {
    const sliceHeight = Math.min(remainingHeight, A4_HEIGHT_MM);
    const isLastPage = sliceHeight < A4_HEIGHT_MM;

    if (!isFirstPage) {
      if (isLastPage) {
        pdf.addPage([A4_WIDTH_MM, sliceHeight]);
      } else {
        pdf.addPage();
      }
    }

    pdf.addImage(dataUrl, "PNG", 0, -yOffset, imgWidthMm, imgHeightMm);

    yOffset += sliceHeight;
    remainingHeight -= sliceHeight;
    isFirstPage = false;
  }

  pdf.save(fileName);
}
