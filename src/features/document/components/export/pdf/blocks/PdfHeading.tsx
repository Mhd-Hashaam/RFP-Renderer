import { Text, StyleSheet } from '@react-pdf/renderer';
import type { HeadingBlock } from '@/features/document/model/types';
import { HEADING_STYLES, PDF_COLORS } from '../styles';

type PdfHeadingProps = {
  block: HeadingBlock;
};

/**
 * Renders a heading block in PDF with appropriate font size and styling.
 */
export function PdfHeading({ block }: PdfHeadingProps) {
  const levelStyles = HEADING_STYLES[block.level];

  return (
    <Text
      style={[
        styles.heading,
        {
          fontSize: levelStyles.fontSize,
          marginBottom: levelStyles.marginBottom,
        },
      ]}
    >
      {block.content}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: PDF_COLORS.text,
    fontFamily: 'Times-Bold',
    lineHeight: 1.3,
  },
});
