import { Text, StyleSheet } from '@react-pdf/renderer';
import type { ParagraphBlock } from '@/features/document/model/types';
import { PDF_COLORS, PDF_TYPOGRAPHY } from '../styles';

type PdfParagraphProps = {
  block: ParagraphBlock;
};

/**
 * Renders a paragraph block in PDF with body text styling.
 */
export function PdfParagraph({ block }: PdfParagraphProps) {
  return <Text style={styles.paragraph}>{block.content}</Text>;
}

const styles = StyleSheet.create({
  paragraph: {
    fontSize: PDF_TYPOGRAPHY.body.fontSize,
    lineHeight: PDF_TYPOGRAPHY.body.lineHeight,
    color: PDF_COLORS.text,
    fontFamily: 'Helvetica',
    marginBottom: 8,
    textAlign: 'justify',
  },
});
