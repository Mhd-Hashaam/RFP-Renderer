# Design Document: React PDF Export

## Overview

This design replaces the broken html2canvas-pro + jspdf screenshot-based PDF export with a declarative @react-pdf/renderer implementation. The new system generates real PDFs with selectable text, proper layout fidelity, and reliable rendering by converting the semantic Block[] structure directly to PDF components.

### Key Design Principles

1. **Declarative PDF Generation**: Use @react-pdf/renderer's React component model to mirror web section layouts
2. **Semantic Fidelity**: Leverage existing semantic layout pipeline (Block[] → ClassifiedSection[]) for consistent rendering
3. **Client-Side Execution**: Pure browser-based generation with no server dependencies
4. **Visual Consistency**: Match web renderer's desktop layout, typography, and dark theme styling
5. **Performance**: Parallel image loading, asset caching, and non-blocking execution

### Architecture Decision

**Why @react-pdf/renderer over html2canvas?**
- Produces real PDFs with selectable text (not raster images)
- Declarative React component model matches our existing architecture
- Reliable layout calculations (no scroll offset bugs)
- Smaller file sizes (vector text vs. rasterized screenshots)
- Better accessibility and searchability

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        DocumentApp                               │
│  ┌──────────────┐                                               │
│  │ Export Button│──┐                                            │
│  └──────────────┘  │                                            │
│                    │                                            │
│  ┌─────────────────▼────────────────────────────────────────┐  │
│  │           PDF Export Orchestrator                        │  │
│  │  • Reads Block[] from Document Store                     │  │
│  │  • Runs semantic layout pipeline                         │  │
│  │  • Coordinates PDF generation                            │  │
│  └─────────────────┬────────────────────────────────────────┘  │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼─────────────┐
│ Semantic Layout  │    │  PDF Generator       │
│ Pipeline         │    │  (@react-pdf/renderer)│
│                  │    │                      │
│ • groupIntoSections│  │ • PDF Templates     │
│ • analyzeSection │    │ • Block Parser      │
│ • classifySection│    │ • Image Loader      │
│ • paginateSections│   │ • Style Mapper      │
└──────────────────┘    └──────────────────────┘
```

### Component Architecture


```
src/features/document/components/export/
├── exportPdfFromElement.ts          # Main orchestrator (replaces existing)
├── pdf/
│   ├── PdfDocument.tsx              # Root PDF document wrapper
│   ├── templates/
│   │   ├── HeroPdfTemplate.tsx      # Hero section PDF layout
│   │   ├── FeaturePdfTemplate.tsx   # Feature section PDF layout
│   │   ├── GalleryPdfTemplate.tsx   # Gallery section PDF layout
│   │   └── ContentPdfTemplate.tsx   # Content section PDF layout
│   ├── blocks/
│   │   ├── PdfHeading.tsx           # Heading block renderer
│   │   ├── PdfParagraph.tsx         # Paragraph block renderer
│   │   ├── PdfList.tsx              # List block renderer
│   │   └── PdfImage.tsx             # Image block renderer
│   ├── BlockToPdfParser.tsx         # Block[] → PDF component converter
│   ├── ImageLoader.ts               # Image path resolution & caching
│   └── styles.ts                    # PDF style constants & mappers
```

### Data Flow

```
User clicks "Export PDF"
        ↓
exportPdfFromElement(container, fileName)
        ↓
Read Block[] from Document Store
        ↓
Run semantic layout pipeline
  • groupIntoSections(blocks)
  • analyzeSection(section, index, total)
  • classifySection(section, features, featureIndex)
        ↓
ClassifiedSection[] array
        ↓
Preload all images in parallel
  • Convert relative paths → absolute URLs
  • Fetch and cache image data
        ↓
Render PdfDocument component
  • Map each ClassifiedSection to appropriate template
  • HeroPdfTemplate / FeaturePdfTemplate / etc.
  • Each template uses BlockToPdfParser for content
        ↓
@react-pdf/renderer pdf() function
  • Generates PDF blob
        ↓
Trigger browser download
```

## Components and Interfaces

### 1. Export Orchestrator

**File**: `src/features/document/components/export/exportPdfFromElement.ts`

```typescript
/**
 * Main entry point for PDF export.
 * Replaces the existing html2canvas-pro implementation.
 */
export async function exportPdfFromElement(
  container: HTMLElement,
  fileName: string = "rfp-document.pdf"
): Promise<void>;
```

**Responsibilities**:
- Read Block[] from Document Store
- Run semantic layout pipeline to get ClassifiedSection[]
- Preload and cache all images
- Render PdfDocument component with classified sections
- Generate PDF using @react-pdf/renderer's pdf() function
- Trigger browser download

**Error Handling**:
- Catch and log all errors
- Display user-friendly error messages
- Continue generation if individual images fail (use placeholders)
- Reset button state on failure

### 2. PDF Document Wrapper

**File**: `src/features/document/components/export/pdf/PdfDocument.tsx`

```typescript
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ClassifiedSection } from '@/features/document/model/types';

type PdfDocumentProps = {
  sections: ClassifiedSection[];
  imageCache: Map<string, string>; // src → data URL
};

export function PdfDocument({ sections, imageCache }: PdfDocumentProps): JSX.Element;
```

**Responsibilities**:
- Root `<Document>` wrapper
- Create `<Page>` components with A4 dimensions
- Apply consistent margins (20mm top/bottom, 15mm left/right)
- Render page numbers (except first page)
- Route each ClassifiedSection to appropriate template based on role

**Page Configuration**:
```typescript
const PAGE_CONFIG = {
  size: 'A4',           // 210mm × 297mm
  orientation: 'portrait',
  margins: {
    top: 56.7,          // 20mm in points
    bottom: 56.7,
    left: 42.5,         // 15mm in points
    right: 42.5,
  },
};
```

### 3. PDF Templates

#### HeroPdfTemplate

**File**: `src/features/document/components/export/pdf/templates/HeroPdfTemplate.tsx`

```typescript
import { View, StyleSheet } from '@react-pdf/renderer';
import type { ClassifiedSection } from '@/features/document/model/types';
import { BlockToPdfParser } from '../BlockToPdfParser';
import { PdfImage } from '../blocks/PdfImage';

type HeroPdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, string>;
};

export function HeroPdfTemplate({ section, imageCache }: HeroPdfTemplateProps): JSX.Element;
```

**Layout**:
- 2:1 text-to-image column ratio (66.67% text, 33.33% image)
- Heading: 48pt bold Playfair Display (or fallback serif)
- Body content: 14pt Inter (or fallback sans-serif)
- Image: 4:3 aspect ratio, rounded corners
- Spacing: 64pt bottom margin

**Style Mapping**:
```typescript
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 64,
  },
  textColumn: {
    flex: 2,
  },
  imageColumn: {
    flex: 1,
  },
  heading: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fafafa',      // zinc-100
    marginBottom: 16,
    fontFamily: 'Playfair Display',
  },
  image: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 12,
  },
});
```

#### FeaturePdfTemplate

**File**: `src/features/document/components/export/pdf/templates/FeaturePdfTemplate.tsx`

```typescript
type FeaturePdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, string>;
};

export function FeaturePdfTemplate({ section, imageCache }: FeaturePdfTemplateProps): JSX.Element;
```

**Layout**:
- 1:1 text-to-image column ratio (50% text, 50% image)
- Alternating layout based on featureIndex (even = image left, odd = image right)
- Heading: 24pt bold
- Body content: 14pt
- Image: 16:9 aspect ratio
- Spacing: 64pt bottom margin

**Layout Logic**:
```typescript
const imageLeft = section.featureIndex % 2 === 0;

return (
  <View style={styles.container}>
    {imageLeft ? (
      <>
        <View style={styles.imageColumn}>{/* image */}</View>
        <View style={styles.textColumn}>{/* text */}</View>
      </>
    ) : (
      <>
        <View style={styles.textColumn}>{/* text */}</View>
        <View style={styles.imageColumn}>{/* image */}</View>
      </>
    )}
  </View>
);
```

#### GalleryPdfTemplate

**File**: `src/features/document/components/export/pdf/templates/GalleryPdfTemplate.tsx`

```typescript
type GalleryPdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, string>;
};

export function GalleryPdfTemplate({ section, imageCache }: GalleryPdfTemplateProps): JSX.Element;
```

**Layout**:
- Full-width heading (24pt bold)
- Multi-column image grid (2 columns)
- Special case: 3 images → first spans 2 columns, next two in 1 column each
- Image aspect ratio: 16:9
- Spacing: 12pt gap between images, 64pt bottom margin

**Grid Logic**:
```typescript
function getGridLayout(imageCount: number): 'single' | 'two-col' | 'three-special' {
  if (imageCount === 1) return 'single';
  if (imageCount === 3) return 'three-special';
  return 'two-col';
}
```

#### ContentPdfTemplate

**File**: `src/features/document/components/export/pdf/templates/ContentPdfTemplate.tsx`

```typescript
type ContentPdfTemplateProps = {
  section: ClassifiedSection;
  imageCache: Map<string, string>;
};

export function ContentPdfTemplate({ section, imageCache }: ContentPdfTemplateProps): JSX.Element;
```

**Layout**:
- Single-column prose layout
- Max width: 65ch (prose width)
- Heading: 20pt bold
- Body content: 14pt
- Spacing: 24pt between blocks, 64pt bottom margin

### 4. Block Renderers

#### PdfHeading

**File**: `src/features/document/components/export/pdf/blocks/PdfHeading.tsx`

```typescript
import { Text, StyleSheet } from '@react-pdf/renderer';
import type { HeadingBlock } from '@/features/document/model/types';

type PdfHeadingProps = {
  block: HeadingBlock;
};

export function PdfHeading({ block }: PdfHeadingProps): JSX.Element;
```

**Typography Mapping**:
```typescript
const HEADING_STYLES = {
  1: { fontSize: 48, marginBottom: 16 },  // text-5xl
  2: { fontSize: 24, marginBottom: 12 },  // text-2xl
  3: { fontSize: 20, marginBottom: 10 },  // text-xl
};
```

#### PdfParagraph

**File**: `src/features/document/components/export/pdf/blocks/PdfParagraph.tsx`

```typescript
import { Text, StyleSheet } from '@react-pdf/renderer';
import type { ParagraphBlock } from '@/features/document/model/types';

type PdfParagraphProps = {
  block: ParagraphBlock;
};

export function PdfParagraph({ block }: PdfParagraphProps): JSX.Element;
```

**Style**:
```typescript
const styles = StyleSheet.create({
  paragraph: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#fafafa',
    marginBottom: 12,
  },
});
```

#### PdfList

**File**: `src/features/document/components/export/pdf/blocks/PdfList.tsx`

```typescript
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ListBlock } from '@/features/document/model/types';

type PdfListProps = {
  block: ListBlock;
};

export function PdfList({ block }: PdfListProps): JSX.Element;
```

**Implementation**:
```typescript
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
```

#### PdfImage

**File**: `src/features/document/components/export/pdf/blocks/PdfImage.tsx`

```typescript
import { View, Image, Text, StyleSheet } from '@react-pdf/renderer';
import type { ImageBlock } from '@/features/document/model/types';

type PdfImageProps = {
  block: ImageBlock;
  imageCache: Map<string, string>;
  aspectRatio?: number;
};

export function PdfImage({ block, imageCache, aspectRatio = 16/9 }: PdfImageProps): JSX.Element;
```

**Implementation**:
```typescript
export function PdfImage({ block, imageCache, aspectRatio }: PdfImageProps) {
  const dataUrl = imageCache.get(block.src);
  
  if (!dataUrl) {
    // Fallback placeholder
    return (
      <View style={[styles.placeholder, { aspectRatio }]}>
        <Text style={styles.placeholderText}>{block.alt}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Image src={dataUrl} style={[styles.image, { aspectRatio }]} />
      {block.caption && (
        <Text style={styles.caption}>{block.caption}</Text>
      )}
    </View>
  );
}
```

### 5. Block Parser

**File**: `src/features/document/components/export/pdf/BlockToPdfParser.tsx`

```typescript
import type { Block } from '@/features/document/model/types';
import { PdfHeading } from './blocks/PdfHeading';
import { PdfParagraph } from './blocks/PdfParagraph';
import { PdfList } from './blocks/PdfList';
import { PdfImage } from './blocks/PdfImage';

type BlockToPdfParserProps = {
  blocks: Block[];
  imageCache: Map<string, string>;
};

export function BlockToPdfParser({ blocks, imageCache }: BlockToPdfParserProps): JSX.Element;
```

**Implementation**:
```typescript
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
          case 'group':
            return (
              <View key={block.id}>
                <BlockToPdfParser blocks={block.children} imageCache={imageCache} />
              </View>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
```

### 6. Image Loader

**File**: `src/features/document/components/export/pdf/ImageLoader.ts`

```typescript
/**
 * Converts relative image paths to absolute URLs and loads them as data URLs.
 * @react-pdf/renderer requires absolute URLs or data URLs for images.
 */
export class ImageLoader {
  private cache: Map<string, string> = new Map();
  
  /**
   * Preload all images from sections in parallel.
   */
  async preloadImages(sections: ClassifiedSection[]): Promise<Map<string, string>>;
  
  /**
   * Load a single image and convert to data URL.
   */
  private async loadImage(src: string): Promise<string>;
  
  /**
   * Convert relative path to absolute URL.
   */
  private resolveImagePath(src: string): string;
}
```

**Implementation Details**:

```typescript
export class ImageLoader {
  private cache: Map<string, string> = new Map();
  
  async preloadImages(sections: ClassifiedSection[]): Promise<Map<string, string>> {
    const imageSrcs = new Set<string>();
    
    // Collect all unique image sources
    for (const section of sections) {
      for (const block of section.content) {
        if (block.type === 'image') {
          imageSrcs.add(block.src);
        } else if (block.type === 'group') {
          this.collectImagesFromGroup(block, imageSrcs);
        }
      }
    }
    
    // Load all images in parallel
    const promises = Array.from(imageSrcs).map(async (src) => {
      try {
        const dataUrl = await this.loadImage(src);
        this.cache.set(src, dataUrl);
      } catch (error) {
        console.error(`Failed to load image: ${src}`, error);
        // Don't set in cache - will use placeholder
      }
    });
    
    await Promise.all(promises);
    return this.cache;
  }
  
  private async loadImage(src: string): Promise<string> {
    const absoluteUrl = this.resolveImagePath(src);
    
    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  private resolveImagePath(src: string): string {
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // Convert relative path to absolute URL
    const base = window.location.origin;
    const path = src.startsWith('/') ? src : `/${src}`;
    return `${base}${path}`;
  }
  
  private collectImagesFromGroup(group: GroupBlock, imageSrcs: Set<string>): void {
    for (const child of group.children) {
      if (child.type === 'image') {
        imageSrcs.add(child.src);
      } else if (child.type === 'group') {
        this.collectImagesFromGroup(child, imageSrcs);
      }
    }
  }
}
```

### 7. Style System

**File**: `src/features/document/components/export/pdf/styles.ts`

```typescript
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
    fontSize: 48,           // text-5xl
    fontWeight: 'bold',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 24,           // text-2xl
    fontWeight: 'bold',
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 20,           // text-xl
    fontWeight: 'bold',
    lineHeight: 1.4,
  },
  body: {
    fontSize: 14,           // text-base
    fontWeight: 'normal',
    lineHeight: 1.6,
  },
  caption: {
    fontSize: 12,           // text-xs
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
} as const;

/**
 * Spacing scale matching web renderer.
 */
export const PDF_SPACING = {
  sectionMargin: 64,        // mb-16 (16 * 4px)
  columnGap: 24,            // gap-8 (8 * 4px)
  blockGap: 12,             // gap-3 (3 * 4px)
  imageGap: 12,             // gap-3
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
    fontFamily: 'Helvetica-Oblique',
  },
});
```

## Data Models

### Image Cache

```typescript
type ImageCache = Map<string, string>;
// Key: original src path (e.g., "/Assets/Main.webp")
// Value: data URL (e.g., "data:image/webp;base64,...")
```

### PDF Generation Context

```typescript
type PdfGenerationContext = {
  sections: ClassifiedSection[];
  imageCache: ImageCache;
  fileName: string;
};
```

### Error Types

```typescript
type PdfExportError = 
  | { type: 'image_load_failed'; src: string; error: Error }
  | { type: 'pdf_generation_failed'; error: Error }
  | { type: 'download_failed'; error: Error };
```


## Correctness Properties

**Assessment**: This feature involves significant UI rendering, external library integration (@react-pdf/renderer), browser APIs (file download, fetch), and visual output that is subjective. While some logic is testable with property-based testing (routing, parsing, transformations), much of the feature requires integration testing and visual verification.

**Property-Based Testing Applicability**: PARTIAL

We will write properties for:
- Pure transformation logic (path resolution, block parsing, template routing)
- Deterministic mappings (block type → component, role → template)
- Style consistency (typography, colors)

We will NOT write properties for:
- Visual layout fidelity (requires visual regression testing)
- External library behavior (@react-pdf/renderer pagination)
- Browser API integration (file download, image loading)
- Performance characteristics (timing-dependent)

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties:

**Candidate Properties**:
1. Template routing: For any ClassifiedSection, the correct template is used based on role
2. Feature layout alternation: For any featureIndex, even → image left, odd → image right
3. Gallery grid layout: For any image count, correct grid layout is applied
4. Block parsing: For any Block type, correct PDF component is rendered
5. Typography mapping: For any heading level, correct font size is applied
6. Color consistency: For any text component, zinc-100 color is applied
7. Image path resolution: For any relative path, valid absolute URL is produced
8. Image placeholder: For any missing image, placeholder is rendered
9. Image embedding: For any section with ImageBlock, PdfImage is rendered

**Redundancy Analysis**:
- Properties 1, 2, 3 all test template/layout selection logic but at different granularities
- Property 1 (template routing) is the most fundamental - it subsumes the template selection aspect
- Properties 2 and 3 test specific layout logic within templates - these are valuable for their specific domains
- Property 4 (block parsing) is fundamental and unique
- Property 5 (typography) and 6 (colors) test style mappings - both valuable
- Property 7 (path resolution) is a pure transformation - valuable
- Properties 8 and 9 both test image handling but in different scenarios (missing vs present) - both valuable

**Final Properties** (after removing redundancy):
1. Template routing based on section role
2. Feature section layout alternation
3. Gallery grid layout selection
4. Block type to PDF component mapping
5. Heading level to font size mapping
6. Image path resolution
7. Image placeholder for missing images

### Property 1: Template Routing

*For any* ClassifiedSection with a given role (hero, feature, gallery, content), the PDF document SHALL render that section using the corresponding template component (HeroPdfTemplate, FeaturePdfTemplate, GalleryPdfTemplate, ContentPdfTemplate).

**Validates: Requirements 1.5, 1.6, 1.7, 1.8**

### Property 2: Feature Layout Alternation

*For any* ClassifiedSection with role "feature" and any featureIndex value, the FeaturePdfTemplate SHALL position the image on the left when featureIndex is even and on the right when featureIndex is odd.

**Validates: Requirements 2.3**

### Property 3: Gallery Grid Layout

*For any* GallerySection with N images, the grid layout SHALL be: single-column for N=1, two-column for N=2, special three-layout (first spans 2 cols) for N=3, and uniform two-column for N≥4.

**Validates: Requirements 2.4**

### Property 4: Block Type Mapping

*For any* valid Block object, the BlockToPdfParser SHALL render the correct PDF component: HeadingBlock → PdfHeading, ParagraphBlock → PdfParagraph, ListBlock → PdfList, ImageBlock → PdfImage, GroupBlock → recursive parsing.

**Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**

### Property 5: Typography Consistency

*For any* HeadingBlock with level L (1, 2, or 3), the rendered PDF heading SHALL have fontSize of 48pt for L=1, 24pt for L=2, and 20pt for L=3.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Image Path Resolution

*For any* relative image path (not starting with http:// or https://), the ImageLoader.resolveImagePath function SHALL produce an absolute URL starting with the window.location.origin.

**Validates: Requirements 4.3**

### Property 7: Image Placeholder Fallback

*For any* ImageBlock where the image source is not present in the imageCache, the PdfImage component SHALL render a placeholder View with the alt text instead of an Image component.

**Validates: Requirements 4.7**

## Error Handling

### Error Categories

1. **Image Loading Errors**
   - Network failures
   - Invalid image formats
   - Missing files
   - CORS issues

2. **PDF Generation Errors**
   - @react-pdf/renderer rendering failures
   - Invalid component structure
   - Memory exhaustion

3. **Download Errors**
   - Browser API failures
   - User cancellation
   - Insufficient permissions

### Error Handling Strategy

```typescript
// Error boundary for PDF generation
class PdfExportError extends Error {
  constructor(
    message: string,
    public readonly type: PdfExportError['type'],
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'PdfExportError';
  }
}

// Error handler in exportPdfFromElement
async function exportPdfFromElement(
  container: HTMLElement,
  fileName: string = "rfp-document.pdf"
): Promise<void> {
  try {
    // ... PDF generation logic
  } catch (error) {
    console.error('PDF export failed:', error);
    
    // User-friendly error message
    const message = error instanceof PdfExportError
      ? error.message
      : 'PDF generation failed. Please try again.';
    
    // Display error to user (via toast/alert)
    showErrorMessage(message);
    
    // Re-throw for caller to handle
    throw error;
  }
}
```

### Image Loading Error Handling

```typescript
class ImageLoader {
  async preloadImages(sections: ClassifiedSection[]): Promise<Map<string, string>> {
    const promises = Array.from(imageSrcs).map(async (src) => {
      try {
        const dataUrl = await this.loadImage(src);
        this.cache.set(src, dataUrl);
      } catch (error) {
        // Log but don't fail - use placeholder instead
        console.warn(`Failed to load image: ${src}`, error);
        // Don't set in cache - PdfImage will render placeholder
      }
    });
    
    await Promise.all(promises);
    return this.cache;
  }
}
```

### Graceful Degradation

1. **Missing Images**: Render placeholder with alt text
2. **Partial Failures**: Continue generation with available content
3. **Timeout**: Show progress indicator, allow cancellation
4. **Memory Issues**: Reduce image quality, batch processing

### Error Messages

```typescript
const ERROR_MESSAGES = {
  IMAGE_LOAD_FAILED: 'Some images could not be loaded. Placeholders will be used.',
  PDF_GENERATION_FAILED: 'PDF generation failed. Please try again.',
  DOWNLOAD_FAILED: 'Could not download PDF. Please check your browser settings.',
  TIMEOUT: 'PDF generation is taking longer than expected. Please wait...',
} as const;
```

## Testing Strategy

### Testing Approach

This feature requires a **hybrid testing strategy** combining:
1. **Property-based tests** for pure transformation logic
2. **Unit tests** for component structure and specific examples
3. **Integration tests** for end-to-end PDF generation
4. **Visual regression tests** for layout fidelity

### Property-Based Tests

**Library**: fast-check (already in devDependencies)

**Configuration**: Minimum 100 iterations per property test

**Test Structure**:
```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('PDF Export Properties', () => {
  it('Property 1: Template routing based on section role', () => {
    fc.assert(
      fc.property(
        fc.record({
          role: fc.constantFrom('hero', 'feature', 'gallery', 'content'),
          // ... other ClassifiedSection fields
        }),
        (section) => {
          const template = selectTemplate(section);
          
          switch (section.role) {
            case 'hero':
              expect(template).toBe(HeroPdfTemplate);
              break;
            case 'feature':
              expect(template).toBe(FeaturePdfTemplate);
              break;
            case 'gallery':
              expect(template).toBe(GalleryPdfTemplate);
              break;
            case 'content':
              expect(template).toBe(ContentPdfTemplate);
              break;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: react-pdf-export, Property 1: Template routing based on section role
});
```

**Property Test Tags**: Each test must include a comment with the format:
```typescript
// Feature: react-pdf-export, Property N: [property description]
```

### Unit Tests

**Focus Areas**:
- Component rendering without errors
- Style object structure
- Conditional rendering logic
- Error handling paths

**Example**:
```typescript
describe('PdfImage', () => {
  it('renders placeholder when image not in cache', () => {
    const block: ImageBlock = {
      id: '1',
      type: 'image',
      src: '/missing.jpg',
      alt: 'Missing image',
    };
    const cache = new Map();
    
    const { container } = render(
      <PdfImage block={block} imageCache={cache} />
    );
    
    expect(container.textContent).toContain('Missing image');
  });
});
```

### Integration Tests

**Focus Areas**:
- End-to-end PDF generation
- Image loading and caching
- Store integration
- Browser API mocking

**Example**:
```typescript
describe('exportPdfFromElement', () => {
  it('generates PDF from document store', async () => {
    const mockStore = createMockStore();
    const container = document.createElement('div');
    
    await exportPdfFromElement(container, 'test.pdf');
    
    // Verify PDF was generated and download triggered
    expect(mockDownload).toHaveBeenCalledWith('test.pdf');
  });
});
```

### Visual Regression Tests

**Approach**: Generate PDFs for known test cases and compare against baseline snapshots.

**Tools**: 
- PDF.js for rendering PDF to canvas
- pixelmatch for image comparison

**Test Cases**:
- Hero section with image
- Feature section (even/odd featureIndex)
- Gallery section (1, 2, 3, 4+ images)
- Content section
- Multi-page document

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage of pure functions and components
- **Property Tests**: 7 properties covering core transformation logic
- **Integration Tests**: All user-facing workflows
- **Visual Tests**: All section types and layout variations

### Performance Testing

**Benchmarks**:
- 5 sections: < 2 seconds
- 10 sections: < 5 seconds
- 20 sections: < 10 seconds

**Measurement**:
```typescript
describe('PDF Export Performance', () => {
  it('generates 5-section PDF in under 2 seconds', async () => {
    const start = performance.now();
    await exportPdfFromElement(container);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(2000);
  });
});
```

## Performance Optimizations

### 1. Parallel Image Loading

```typescript
// Load all images concurrently
async preloadImages(sections: ClassifiedSection[]): Promise<Map<string, string>> {
  const promises = Array.from(imageSrcs).map(src => this.loadImage(src));
  await Promise.all(promises);
  return this.cache;
}
```

### 2. Image Caching

```typescript
// Cache images for the duration of export operation
class ImageLoader {
  private cache: Map<string, string> = new Map();
  
  async loadImage(src: string): Promise<string> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    // ... load and cache
  }
}
```

### 3. Non-Blocking Execution

```typescript
// Use requestIdleCallback for non-critical work
async function exportPdfFromElement(...) {
  // Critical path: load images, generate PDF
  await generatePdf();
  
  // Non-critical: cleanup, analytics
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      cleanup();
      trackExport();
    });
  }
}
```

### 4. Lazy Component Rendering

```typescript
// Only render visible sections initially
// @react-pdf/renderer handles pagination automatically
// No manual optimization needed
```

### 5. Memory Management

```typescript
// Clear image cache after export
async function exportPdfFromElement(...) {
  const loader = new ImageLoader();
  try {
    const cache = await loader.preloadImages(sections);
    await generatePdf(cache);
  } finally {
    loader.clearCache(); // Free memory
  }
}
```

### 6. Bundle Size Optimization

```typescript
// Dynamic import for @react-pdf/renderer (only load when needed)
async function exportPdfFromElement(...) {
  const { pdf } = await import('@react-pdf/renderer');
  // ... use pdf()
}
```

**Expected Bundle Impact**: ~300KB (gzipped) for @react-pdf/renderer

### 7. Image Optimization

```typescript
// Convert large images to lower quality for PDF
async loadImage(src: string): Promise<string> {
  const blob = await response.blob();
  
  // Optionally compress if > 1MB
  if (blob.size > 1024 * 1024) {
    return await this.compressImage(blob);
  }
  
  return this.blobToDataUrl(blob);
}
```

## Implementation Guidance

### Phase 1: Core Infrastructure (Days 1-2)

1. Install @react-pdf/renderer
   ```bash
   npm install @react-pdf/renderer
   ```

2. Create directory structure
   ```
   src/features/document/components/export/pdf/
   ```

3. Implement ImageLoader class
   - Path resolution
   - Fetch and cache logic
   - Error handling

4. Create style constants (styles.ts)
   - Color palette
   - Typography scale
   - Spacing values

### Phase 2: Block Renderers (Days 3-4)

1. Implement PdfHeading
   - Typography mapping
   - Style application

2. Implement PdfParagraph
   - Text rendering
   - Line height

3. Implement PdfList
   - Bullet/number markers
   - Item spacing

4. Implement PdfImage
   - Image rendering
   - Caption support
   - Placeholder fallback

5. Implement BlockToPdfParser
   - Type switching
   - Recursive group handling

### Phase 3: Section Templates (Days 5-7)

1. Implement HeroPdfTemplate
   - 2:1 column layout
   - Image positioning

2. Implement FeaturePdfTemplate
   - 1:1 column layout
   - Alternating logic

3. Implement GalleryPdfTemplate
   - Grid layout
   - Special 3-image case

4. Implement ContentPdfTemplate
   - Single-column prose

### Phase 4: Document Generation (Days 8-9)

1. Implement PdfDocument wrapper
   - Page configuration
   - Template routing
   - Page numbers

2. Update exportPdfFromElement
   - Store integration
   - Pipeline execution
   - Image preloading
   - PDF generation
   - Download trigger

### Phase 5: Error Handling & Polish (Days 10-11)

1. Add error boundaries
2. Implement loading states
3. Add user feedback
4. Handle edge cases

### Phase 6: Testing (Days 12-14)

1. Write property-based tests
2. Write unit tests
3. Write integration tests
4. Visual regression tests
5. Performance benchmarks

### Phase 7: Cleanup (Day 15)

1. Remove html2canvas-pro dependency
2. Remove jspdf dependency
3. Update documentation
4. Code review

## Migration Strategy

### Backward Compatibility

The new implementation maintains the same function signature:

```typescript
// Before (html2canvas-pro)
export async function exportPdfFromElement(
  container: HTMLElement,
  fileName?: string
): Promise<void>;

// After (@react-pdf/renderer)
export async function exportPdfFromElement(
  container: HTMLElement,
  fileName?: string
): Promise<void>;
```

### Rollout Plan

1. **Development**: Implement new system in parallel
2. **Testing**: Comprehensive test suite
3. **Feature Flag**: Optional toggle between old/new (if needed)
4. **Deployment**: Replace old implementation
5. **Monitoring**: Track error rates and performance
6. **Cleanup**: Remove old dependencies

### Rollback Strategy

If critical issues arise:
1. Revert to git commit before changes
2. Keep old dependencies in package.json temporarily
3. Fix issues in new implementation
4. Re-deploy

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@react-pdf/renderer": "^4.2.0"
  }
}
```

### Dependencies to Remove

```json
{
  "dependencies": {
    "html2canvas-pro": "^2.0.2",  // Remove
    "jspdf": "^4.2.1"              // Remove
  }
}
```

### Peer Dependencies

- react: ^19.2.4 (already installed)
- react-dom: ^19.2.4 (already installed)

## Security Considerations

### Image Loading

- **CORS**: Images must be served with appropriate CORS headers
- **Content Security Policy**: Ensure data URLs are allowed
- **Path Traversal**: Validate image paths to prevent directory traversal attacks

```typescript
private resolveImagePath(src: string): string {
  // Prevent path traversal
  if (src.includes('..')) {
    throw new Error('Invalid image path');
  }
  
  // Only allow specific directories
  if (!src.startsWith('/Assets/') && !src.startsWith('http')) {
    throw new Error('Image must be from /Assets/ directory');
  }
  
  return this.buildAbsoluteUrl(src);
}
```

### PDF Generation

- **XSS**: Sanitize user-provided text content
- **Memory**: Limit document size to prevent DoS
- **File Size**: Warn users about large exports

```typescript
const MAX_SECTIONS = 100;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

if (sections.length > MAX_SECTIONS) {
  throw new Error('Document too large');
}
```

## Accessibility

### PDF Accessibility Features

1. **Selectable Text**: All text is real text (not images)
2. **Semantic Structure**: Proper heading hierarchy
3. **Alt Text**: Images include alt text from ImageBlock
4. **Reading Order**: Logical content flow

### Limitations

- @react-pdf/renderer has limited accessibility support
- Screen readers may not fully parse generated PDFs
- Consider providing HTML export as alternative

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Known Issues

- Safari: May require user interaction for download
- Firefox: Large PDFs may be slow
- Mobile: Limited testing, may have memory constraints

### Polyfills

None required - @react-pdf/renderer handles browser differences

## Monitoring and Observability

### Metrics to Track

1. **Success Rate**: % of successful exports
2. **Error Rate**: % of failed exports by error type
3. **Performance**: P50, P95, P99 generation times
4. **File Size**: Average PDF size by section count
5. **Image Load Failures**: % of images that fail to load

### Logging

```typescript
// Log export attempts
console.log('PDF export started', {
  sectionCount: sections.length,
  imageCount: totalImages,
  timestamp: Date.now(),
});

// Log completion
console.log('PDF export completed', {
  duration: Date.now() - startTime,
  fileSize: blob.size,
});

// Log errors
console.error('PDF export failed', {
  error: error.message,
  type: error.type,
  sectionCount: sections.length,
});
```

### Error Tracking

Integrate with error tracking service (e.g., Sentry):

```typescript
try {
  await exportPdfFromElement(container, fileName);
} catch (error) {
  // Send to error tracking
  Sentry.captureException(error, {
    tags: {
      feature: 'pdf-export',
      sectionCount: sections.length,
    },
  });
  throw error;
}
```

## Future Enhancements

### Potential Improvements

1. **Custom Fonts**: Load Playfair Display and Inter fonts for exact web match
2. **Page Headers**: Add document title to page headers
3. **Table of Contents**: Generate TOC from section headings
4. **Bookmarks**: Add PDF bookmarks for navigation
5. **Metadata**: Include document metadata (title, author, creation date)
6. **Compression**: Optimize PDF file size
7. **Batch Export**: Export multiple documents at once
8. **Cloud Storage**: Upload to cloud instead of download
9. **Email**: Send PDF via email
10. **Print Preview**: Show preview before download

### Extension Points

```typescript
// Plugin system for custom templates
type PdfTemplatePlugin = {
  role: string;
  template: React.ComponentType<any>;
};

function registerTemplate(plugin: PdfTemplatePlugin): void;

// Custom style themes
type PdfStyleTheme = {
  colors: typeof PDF_COLORS;
  typography: typeof PDF_TYPOGRAPHY;
  spacing: typeof PDF_SPACING;
};

function applyTheme(theme: PdfStyleTheme): void;
```

## Conclusion

This design provides a comprehensive replacement for the broken html2canvas-pro PDF export system. By leveraging @react-pdf/renderer's declarative React component model and the existing semantic layout pipeline, we achieve:

- **Reliability**: No scroll offset bugs, consistent rendering
- **Quality**: Real PDFs with selectable text, not rasterized screenshots
- **Maintainability**: Clean architecture matching existing patterns
- **Performance**: Parallel image loading, efficient caching
- **Testability**: Property-based tests for core logic, integration tests for workflows

The implementation follows the requirements-first workflow, with clear acceptance criteria mapped to design decisions and testable properties.
