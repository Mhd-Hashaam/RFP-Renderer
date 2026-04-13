import { View, StyleSheet } from '@react-pdf/renderer';
import type { ClassifiedSection } from '@/features/document/model/types';
import type { ImageEntry } from '../ImageLoader';
import { BlockToPdfParser } from '../BlockToPdfParser';

type ContentPdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, ImageEntry>;
};

/**
 * Content section template with single-column prose layout.
 * Renders heading and body content in a readable single column.
 */
export function ContentPdfTemplate({ section, imageCache }: ContentPdfTemplateProps) {
  return (
    <View style={styles.container}>
      {section.heading && <BlockToPdfParser blocks={[section.heading]} imageCache={imageCache} />}
      <View style={styles.content}>
        <BlockToPdfParser blocks={section.content} imageCache={imageCache} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  content: {
    width: '100%',
  },
});
