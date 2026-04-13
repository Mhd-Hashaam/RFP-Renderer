import { View, Image, Text, StyleSheet } from '@react-pdf/renderer';
import type { ImageBlock } from '@/features/document/model/types';
import type { ImageEntry } from '../ImageLoader';
import { PDF_COLORS, PDF_TYPOGRAPHY } from '../styles';

type PdfImageProps = {
  block: ImageBlock;
  imageCache: Map<string, ImageEntry>;
};

/**
 * Renders an image block in PDF using the image's natural aspect ratio.
 * Falls back to a 16:9 placeholder if image not in cache.
 */
export function PdfImage({ block, imageCache }: PdfImageProps) {
  const entry = imageCache.get(block.src);

  if (!entry) {
    return (
      <View style={styles.container}>
        <View style={[styles.placeholder, { aspectRatio: 16 / 9 }]}>
          <Text style={styles.placeholderText}>{block.alt}</Text>
        </View>
        {block.caption && <Text style={styles.caption}>{block.caption}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't use HTML alt */}
      <Image src={entry.dataUrl} style={[styles.image, { aspectRatio: entry.aspectRatio }]} />
      {block.caption && <Text style={styles.caption}>{block.caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  image: {
    width: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    width: '100%',
    backgroundColor: '#3f3f46',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: PDF_TYPOGRAPHY.body.fontSize,
    color: PDF_COLORS.textMuted,
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
  caption: {
    fontSize: PDF_TYPOGRAPHY.caption.fontSize,
    fontStyle: PDF_TYPOGRAPHY.caption.fontStyle,
    lineHeight: PDF_TYPOGRAPHY.caption.lineHeight,
    color: PDF_COLORS.textMuted,
    fontFamily: 'Helvetica',
    marginTop: 4,
    textAlign: 'center',
  },
});
