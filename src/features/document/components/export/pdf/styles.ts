import { StyleSheet } from '@react-pdf/renderer';

/**
 * PDF color palette matching dark theme.
 */
export const PDF_COLORS = {
  background: '#27272a',    // zinc-800 (card background)
  text: '#fafafa',          // zinc-100
  textMuted: '#a1a1aa',     // zinc-400
  border: 'rgba(255, 255, 255, 0.1)',
} as const;

/**
 * Typography scale matching web renderer.
 */
export const PDF_TYPOGRAPHY = {
  h1: {
    fontSize: 32,           // Reduced from 48 for better PDF fit
    fontWeight: 'bold' as const,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 20,           // Reduced from 24
    fontWeight: 'bold' as const,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 16,           // Reduced from 20
    fontWeight: 'bold' as const,
    lineHeight: 1.4,
  },
  body: {
    fontSize: 11,           // Reduced from 14 for better density
    fontWeight: 'normal' as const,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 9,            // Reduced from 12
    fontStyle: 'italic' as const,
    lineHeight: 1.4,
  },
} as const;

/**
 * Spacing scale matching web renderer.
 */
export const PDF_SPACING = {
  sectionMargin: 32,        // Reduced from 64 for better density
  columnGap: 16,            // Reduced from 24
  blockGap: 8,              // Reduced from 12
  imageGap: 8,              // Reduced from 12
} as const;

/**
 * Typography mapping for heading levels.
 */
export const HEADING_STYLES = {
  1: { fontSize: 32, marginBottom: 12 },  // Reduced from 48
  2: { fontSize: 20, marginBottom: 10 },  // Reduced from 24
  3: { fontSize: 16, marginBottom: 8 },   // Reduced from 20
} as const;

/**
 * Common PDF styles.
 */
export const commonStyles = StyleSheet.create({
  section: {
    marginBottom: PDF_SPACING.sectionMargin,
  },
  heading: {
    color: PDF_COLORS.text,
    fontFamily: 'Times-Roman',  // Fallback for Playfair Display
  },
  text: {
    color: PDF_COLORS.text,
    fontFamily: 'Helvetica',    // Fallback for Inter
  },
  caption: {
    color: PDF_COLORS.textMuted,
    fontFamily: 'Helvetica',
    fontStyle: 'italic',
  },
});
