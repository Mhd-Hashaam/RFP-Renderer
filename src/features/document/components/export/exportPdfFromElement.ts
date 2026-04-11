import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

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

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: bgColor,
    // Ensure fonts are embedded
    skipFonts: false,
  });

  // Create an Image to get natural dimensions
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
