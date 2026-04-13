import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { runPipeline } from '@/features/document/intelligence/pipeline';
import { SECTION_PAGE_CONTENT_HEIGHT_PX } from '@/features/document/model/constants';
import { ImageLoader } from './pdf/ImageLoader';
import { PdfDocument } from './pdf/PdfDocument';

/**
 * Exports the document as a PDF using @react-pdf/renderer.
 * 
 * This replaces the broken html2canvas-pro implementation with a declarative
 * React-based PDF generation system that produces real PDFs with selectable text.
 * 
 * @param container - HTMLElement (unused, kept for backward compatibility)
 * @param fileName - Output filename (default: "rfp-document.pdf")
 */
export async function exportPdfFromElement(
  container: HTMLElement,
  fileName = "rfp-document.pdf",
): Promise<void> {
  try {
    console.log('Starting PDF export...');
    
    // Read blocks from Document Store
    const blocks = useDocumentStore.getState().blocks;

    if (blocks.length === 0) {
      console.warn('No blocks to export');
      return;
    }

    console.log(`Processing ${blocks.length} blocks...`);

    // Use the same pagination as web app (don't re-paginate for PDF)
    // The web app already has optimal pagination at 1200px viewport height
    const pages = runPipeline(blocks, SECTION_PAGE_CONTENT_HEIGHT_PX);

    if (pages.length === 0) {
      console.warn('No pages generated from blocks');
      return;
    }

    console.log(`Generated ${pages.length} pages with ${pages.reduce((sum, p) => sum + p.sections.length, 0)} total sections for PDF`);

    // Preload all images
    const imageLoader = new ImageLoader();
    const allSections = pages.flatMap((page) => page.sections);
    const imageCache = await imageLoader.preloadImages(allSections);

    console.log(`Loaded ${imageCache.size} images for PDF generation`);

    // Create PDF document structure using PdfDocument component with pages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = React.createElement(PdfDocument, { pages, imageCache }) as any;

    // Generate PDF blob
    console.log('Rendering PDF...');
    const blob = await pdf(doc).toBlob();
    console.log(`PDF rendered: ${blob.size} bytes`);

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    // Cleanup — deferred to idle time to avoid blocking the main thread
    const cleanup = () => {
      URL.revokeObjectURL(url);
      imageLoader.clearCache();
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(cleanup);
    } else {
      setTimeout(cleanup, 0);
    }

    console.log(`PDF exported successfully: ${fileName}`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
