import { View, StyleSheet } from '@react-pdf/renderer';
import type { ClassifiedSection, ImageBlock } from '@/features/document/model/types';
import type { ImageEntry } from '../ImageLoader';
import { BlockToPdfParser } from '../BlockToPdfParser';
import { PdfImage } from '../blocks/PdfImage';
import { PDF_SPACING } from '../styles';

type GalleryPdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, ImageEntry>;
};

type GridLayout = 'single' | 'two-col' | 'three-special';

function getGridLayout(imageCount: number): GridLayout {
  if (imageCount === 1) return 'single';
  if (imageCount === 3) return 'three-special';
  return 'two-col';
}

/**
 * Gallery section template with multi-column image grid.
 * Special layout for 3 images: first spans 2 columns, next two in 1 column each.
 */
export function GalleryPdfTemplate({ section, imageCache }: GalleryPdfTemplateProps) {
  const images = section.content.filter((block) => block.type === 'image') as ImageBlock[];
  const textBlocks = section.content.filter((block) => block.type !== 'image');
  const layout = getGridLayout(images.length);

  return (
    <View style={styles.container}>
      {/* Full-width heading */}
      {section.heading && <BlockToPdfParser blocks={[section.heading]} imageCache={imageCache} />}

      {/* Text blocks before images */}
      {textBlocks.length > 0 && <BlockToPdfParser blocks={textBlocks} imageCache={imageCache} />}

      {/* Image grid */}
      {layout === 'single' && (
        <View style={styles.singleImage}>
          <PdfImage block={images[0]} imageCache={imageCache} />
        </View>
      )}

      {layout === 'two-col' && (
        <View style={styles.grid}>
          {images.map((image) => (
            <View key={image.id} style={styles.gridItem}>
              <PdfImage block={image} imageCache={imageCache} />
            </View>
          ))}
        </View>
      )}

      {layout === 'three-special' && (
        <View style={styles.threeSpecial}>
          {/* First image spans full width */}
          <View style={styles.threeSpecialLarge}>
            <PdfImage block={images[0]} imageCache={imageCache} />
          </View>
          {/* Next two images side by side */}
          <View style={styles.threeSpecialRow}>
            <View style={styles.threeSpecialSmall}>
              <PdfImage block={images[1]} imageCache={imageCache} />
            </View>
            <View style={styles.threeSpecialSmall}>
              <PdfImage block={images[2]} imageCache={imageCache} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  singleImage: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PDF_SPACING.imageGap,
  },
  gridItem: {
    width: '48%',
  },
  threeSpecial: {
    gap: PDF_SPACING.imageGap,
  },
  threeSpecialLarge: {
    width: '100%',
  },
  threeSpecialRow: {
    flexDirection: 'row',
    gap: PDF_SPACING.imageGap,
  },
  threeSpecialSmall: {
    width: '48%',
  },
});
