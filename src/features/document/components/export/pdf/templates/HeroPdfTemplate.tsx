import { View, StyleSheet } from '@react-pdf/renderer';
import type { ClassifiedSection } from '@/features/document/model/types';
import type { ImageEntry } from '../ImageLoader';
import { BlockToPdfParser } from '../BlockToPdfParser';
import { PdfImage } from '../blocks/PdfImage';
import { PDF_SPACING } from '../styles';

type HeroPdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, ImageEntry>;
};

/**
 * Hero section template with 2:1 text-to-image column ratio.
 * Renders heading and body content in left column (66.67% width),
 * first image in right column (33.33% width).
 */
export function HeroPdfTemplate({ section, imageCache }: HeroPdfTemplateProps) {
  // Find first image block
  const firstImage = section.content.find((block) => block.type === 'image');
  const textBlocks = section.content.filter((block) => block.type !== 'image');

  // If no image, render full-width text
  if (!firstImage) {
    return (
      <View style={styles.container}>
        {section.heading && <BlockToPdfParser blocks={[section.heading]} imageCache={imageCache} />}
        <BlockToPdfParser blocks={textBlocks} imageCache={imageCache} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Text column (2/3 width) */}
        <View style={styles.textColumn}>
          {section.heading && <BlockToPdfParser blocks={[section.heading]} imageCache={imageCache} />}
          <BlockToPdfParser blocks={textBlocks} imageCache={imageCache} />
        </View>

        {/* Image column (1/3 width) */}
        <View style={styles.imageColumn}>
          <PdfImage block={firstImage} imageCache={imageCache} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: PDF_SPACING.columnGap,
  },
  textColumn: {
    width: '66%',
  },
  imageColumn: {
    width: '30%',
  },
});
