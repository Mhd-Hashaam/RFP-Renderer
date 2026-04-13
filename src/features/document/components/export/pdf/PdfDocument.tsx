import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { SectionPage } from '@/features/document/model/types';
import type { ImageEntry } from './ImageLoader';
import { HeroPdfTemplate } from './templates/HeroPdfTemplate';
import { FeaturePdfTemplate } from './templates/FeaturePdfTemplate';
import { GalleryPdfTemplate } from './templates/GalleryPdfTemplate';
import { ContentPdfTemplate } from './templates/ContentPdfTemplate';
import { PDF_COLORS } from './styles';

type PdfDocumentProps = {
  pages: SectionPage[];
  imageCache: Map<string, ImageEntry>;
};

/**
 * Root PDF document wrapper.
 * Creates pages with A4 dimensions matching the semantic layout pipeline's pagination.
 * Each SectionPage from the pipeline becomes one PDF page with multiple sections.
 */
export function PdfDocument({ pages, imageCache }: PdfDocumentProps) {
  return (
    <Document>
      {pages.map((page, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" style={styles.page} wrap>
          {/* Page content */}
          <View style={styles.content}>
            {page.sections.map((section) => {
              const template = (() => {
                switch (section.role) {
                  case 'hero':
                    return <HeroPdfTemplate key={section.id} section={section} imageCache={imageCache} />;

                  case 'feature':
                    return <FeaturePdfTemplate key={section.id} section={section} imageCache={imageCache} />;

                  case 'gallery':
                    return <GalleryPdfTemplate key={section.id} section={section} imageCache={imageCache} />;

                  case 'content':
                    return <ContentPdfTemplate key={section.id} section={section} imageCache={imageCache} />;

                  default:
                    return null;
                }
              })();

              return (
                <View key={section.id} style={styles.section}>
                  {template}
                </View>
              );
            })}
          </View>

          {/* Page footer with dynamic page numbers */}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </Page>
      ))}
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.background,
    paddingTop: 40,
    paddingBottom: 50,
    paddingLeft: 40,
    paddingRight: 40,
  },
  content: {
    // Remove flex: 1 to allow natural content height
  },
  section: {
    marginBottom: 24,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: PDF_COLORS.textMuted,
    fontFamily: 'Helvetica',
  },
});
