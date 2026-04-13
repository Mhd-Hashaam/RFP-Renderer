import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ListBlock } from '@/features/document/model/types';
import { PDF_COLORS, PDF_TYPOGRAPHY } from '../styles';

type PdfListProps = {
  block: ListBlock;
};

/**
 * Renders a list block in PDF with bullet or number markers.
 */
export function PdfList({ block }: PdfListProps) {
  return (
    <View style={styles.list}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.marker}>
            {block.style === 'ordered' ? `${index + 1}.` : '•'}
          </Text>
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  marker: {
    fontSize: PDF_TYPOGRAPHY.body.fontSize,
    color: PDF_COLORS.text,
    fontFamily: 'Helvetica',
    width: 20,
    marginRight: 8,
  },
  itemText: {
    fontSize: PDF_TYPOGRAPHY.body.fontSize,
    lineHeight: PDF_TYPOGRAPHY.body.lineHeight,
    color: PDF_COLORS.text,
    fontFamily: 'Helvetica',
    flex: 1,
    textAlign: 'justify',
  },
});
