import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Temporarily removes minHeight from page grid elements so the PDF capture
 * doesn't include empty whitespace at the bottom of the last page.
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
 * Rasterizes the rendered DOM using html-to-image (supports oklch/lab/modern CSS)
 * then stitches pages into a jsPDF document.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#18181b" : "#ffffff";

  // Strip min-heights so the last page doesn't have a blank tail
  const restoreMinHeights = stripMinHeights(element);

  let dataUrl: string;
  try {
    dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: bgColor,
      skipFonts: false,
    });
  } finally {
    restoreMinHeights();
  }

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}
