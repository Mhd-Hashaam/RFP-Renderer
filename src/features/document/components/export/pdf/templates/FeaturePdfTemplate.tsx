import { View, StyleSheet } from '@react-pdf/renderer';
import type { ClassifiedSection } from '@/features/document/model/types';
import type { ImageEntry } from '../ImageLoader';
import { BlockToPdfParser } from '../BlockToPdfParser';
import { PdfImage } from '../blocks/PdfImage';
import { PDF_SPACING } from '../styles';

type FeaturePdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, ImageEntry>;
};

/**
 * Feature section template with 1:1 text-to-image column ratio.
 * Alternates image position based on featureIndex:
 * - Even featureIndex: image left, text right
 * - Odd featureIndex: text left, image right
 */
export function FeaturePdfTemplate({ section, imageCache }: FeaturePdfTemplateProps) {
  // Find first image block
  const firstImage = section.content.find((block) => block.type === 'image');
  const textBlocks = section.content.filter((block) => block.type !== 'image');

  // Determine layout direction based on featureIndex
  const imageLeft = section.featureIndex % 2 === 0;

  // If no image, render full-width text
  if (!firstImage) {
    return (
      <View style={styles.container}>
        {section.heading && <BlockToPdfParser blocks={[section.heading]} imageCache={imageCache} />}
        <BlockToPdfParser blocks={textBlocks} imageCache={imageCache} />
      </View>
    );
  }

  const imageColumn = (
    <View style={styles.column}>
      <PdfImage block={firstImage} imageCache={imageCache} />
    </View>
  );

  const textColumn = (
    <View style={styles.column}>
      {section.heading && <BlockToPdfParser blocks={[section.heading]} imageCache={imageCache} />}
      <BlockToPdfParser blocks={textBlocks} imageCache={imageCache} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {imageLeft ? (
          <>
            {imageColumn}
            {textColumn}
          </>
        ) : (
          <>
            {textColumn}
            {imageColumn}
          </>
        )}
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
  column: {
    width: '48%',
  },
});
