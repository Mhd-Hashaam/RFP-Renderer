import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const RENDER_WIDTH_PX = 1200;

/**
 * Waits for all <img> elements inside a node to finish loading.
 * Uses a 5-second timeout per image so a broken image never hangs the export.
 */
async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          // Already loaded
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const timer = setTimeout(resolve, 5000); // 5s max per image
          img.onload = () => { clearTimeout(timer); resolve(); };
          img.onerror = () => { clearTimeout(timer); resolve(); };
        }),
    ),
  );
}

/**
 * Exports the document as a multi-page PDF using an off-screen clone.
 *
 * The live DOM is never mutated — no layout shifts, no sidebar changes.
 * The clone is rendered at a fixed A4-proportional width and captured
 * after all images have loaded.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#0a0a0a" : "#d2cfc7";

  // ── 1. Off-screen container ────────────────────────────────────────────
  const offscreen = document.createElement("div");
  offscreen.style.cssText = [
    "position:fixed",
    "top:0",
    "left:-9999px",
    `width:${RENDER_WIDTH_PX}px`,
    `background:${bgColor}`,
    "z-index:-1",
    "pointer-events:none",
    "overflow:visible",
  ].join(";");

  // ── 2. Clone content ───────────────────────────────────────────────────
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = [
    `width:${RENDER_WIDTH_PX}px`,
    `max-width:${RENDER_WIDTH_PX}px`,
    "overflow:visible",
    "height:auto",
    "padding:32px",
    "box-sizing:border-box",
  ].join(";");

  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  // ── 3. Wait for images already in the clone (do NOT reset src) ─────────
  await waitForImages(clone);

  // ── 4. Capture ─────────────────────────────────────────────────────────
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
    document.body.removeChild(offscreen);
  }

  // ── 5. Build PDF ───────────────────────────────────────────────────────
  const imgWidthMm = A4_WIDTH_MM;
  const imgHeightMm = (naturalHeight! / naturalWidth!) * imgWidthMm;

  if (imgHeightMm <= A4_HEIGHT_MM) {
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: [A4_WIDTH_MM, imgHeightMm],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(fileName);
    return;
  }

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
