import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Walks every element in the subtree and inlines computed rgb() values for
 * color properties so html2canvas (which can't parse oklch/lab) doesn't choke.
 */
function inlineRgbColors(root: HTMLElement): void {
  const colorProps: (keyof CSSStyleDeclaration)[] = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
  ];

  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const el of all) {
    const cs = window.getComputedStyle(el);
    for (const prop of colorProps) {
      const val = cs[prop] as string;
      if (val) {
        // getComputedStyle always returns rgb/rgba in Chromium even for oklch
        // source values — so this is safe to inline directly.
        (el.style as unknown as Record<string, string>)[prop as string] = val;
      }
    }
  }
}

/**
 * Rasterizes the rendered DOM for WYSIWYG-ish PDF output.
 * Inlines all computed rgb colors before capture to work around html2canvas's
 * lack of support for oklch/lab color functions used by Tailwind v4 + shadcn.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark");
  const bgColor = isDark ? "#18181b" : "#ffffff";

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: bgColor,
    onclone: (_doc, clonedEl) => {
      // Inline all computed rgb values in the cloned subtree
      inlineRgbColors(clonedEl);
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}
