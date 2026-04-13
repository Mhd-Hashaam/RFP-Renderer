import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Block } from '@/features/document/model/types';
import type { ImageEntry } from './ImageLoader';
import { PdfHeading } from './blocks/PdfHeading';
import { PdfParagraph } from './blocks/PdfParagraph';
import { PdfList } from './blocks/PdfList';
import { PdfImage } from './blocks/PdfImage';
import { PDF_COLORS, PDF_TYPOGRAPHY } from './styles';

type BlockToPdfParserProps = {
  blocks: Block[];
  imageCache: Map<string, ImageEntry>;
};

/**
 * Parses an array of Block objects and renders them as PDF components.
 * Handles all block types including recursive group parsing.
 */
export function BlockToPdfParser({ blocks, imageCache }: BlockToPdfParserProps) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading':
            return <PdfHeading key={block.id} block={block} />;

          case 'paragraph':
            return <PdfParagraph key={block.id} block={block} />;

          case 'list':
            return <PdfList key={block.id} block={block} />;

          case 'image':
            return <PdfImage key={block.id} block={block} imageCache={imageCache} />;

          case 'meta':
            return (
              <View key={block.id} style={metaStyles.container}>
                {block.items.map((item) => (
                  <View key={item.label} style={metaStyles.item}>
                    <Text style={metaStyles.label}>{item.label}</Text>
                    <Text style={metaStyles.value}>{item.value}</Text>
                  </View>
                ))}
              </View>
            );

          case 'group':
            return (
              <View key={block.id}>
                <BlockToPdfParser blocks={block.children} imageCache={imageCache} />
              </View>
            );

          default:
            // Exhaustive check - should never reach here
            return null;
        }
      })}
    </>
  );
}

const metaStyles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    width: '45%',
    marginBottom: 4,
  },
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },
  value: {
    fontSize: PDF_TYPOGRAPHY.body.fontSize,
    fontFamily: 'Helvetica',
    color: PDF_COLORS.text,
  },
});
