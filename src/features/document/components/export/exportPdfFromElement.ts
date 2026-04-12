import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Render width in px — A4 at 96dpi ≈ 794px; we use 1200 for higher fidelity
const RENDER_WIDTH_PX = 1200;

/**
 * Waits for all <img> elements inside a node to finish loading.
 * This prevents html-to-image from capturing blank image placeholders.
 */
async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // don't block on broken images
          }
        }),
    ),
  );
}

/**
 * Exports the document as a multi-page PDF.
 *
 * Strategy: clone the target element into a fixed-width off-screen container,
 * wait for all images to load, capture the full clone, then destroy it.
 * This avoids mutating the live DOM (which caused sidebar layout shifts and
 * overflow clipping issues in the previous approach).
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#0a0a0a" : "#d2cfc7";

  // ── 1. Create an off-screen container ──────────────────────────────────
  const offscreen = document.createElement("div");
  offscreen.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: ${RENDER_WIDTH_PX}px;
    background: ${bgColor};
    z-index: -1;
    pointer-events: none;
  `;

  // ── 2. Clone the content into it ───────────────────────────────────────
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = `
    width: ${RENDER_WIDTH_PX}px;
    max-width: ${RENDER_WIDTH_PX}px;
    overflow: visible;
    height: auto;
    padding: 32px;
    box-sizing: border-box;
  `;

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  // ── 3. Wait for all images in the clone to load ────────────────────────
  // Re-trigger loading by resetting src on cloned images
  const clonedImgs = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));
  clonedImgs.forEach((img) => {
    const src = img.getAttribute("src");
    if (src) {
      img.src = "";
      img.src = src;
    }
  });
  await waitForImages(clone);

  // ── 4. Capture the full clone ──────────────────────────────────────────
  let dataUrl: string;
  let naturalWidth: number;
  let naturalHeight: number;

  try {
    dataUrl = await toPng(offscreen, {
      pixelRatio: 2,
      backgroundColor: bgColor,
      skipFonts: false,
      width: RENDER_WIDTH_PX,
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
    // ── 5. Always clean up the off-screen node ─────────────────────────
    document.body.removeChild(offscreen);
  }

  // ── 6. Build the PDF ───────────────────────────────────────────────────
  const imgWidthMm = A4_WIDTH_MM;
  const imgHeightMm = (naturalHeight! / naturalWidth!) * imgWidthMm;

  if (imgHeightMm <= A4_HEIGHT_MM) {
    // Single page — size exactly to content, no trailing blank space
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
