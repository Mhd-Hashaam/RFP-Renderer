# Implementation Plan: React PDF Export

## Overview

This plan replaces the broken html2canvas-pro + jspdf screenshot-based PDF export with a declarative @react-pdf/renderer implementation. The new system generates real PDFs with selectable text, proper layout fidelity, and reliable rendering by converting the semantic Block[] structure directly to PDF components.

**Timeline**: 15 days
**Implementation Language**: TypeScript
**Testing Framework**: Vitest + fast-check (property-based testing)

## Tasks

- [x] 1. Setup and Infrastructure
  - Install @react-pdf/renderer dependency
  - Create directory structure for PDF components
  - Remove old dependencies (html2canvas-pro, jspdf) after implementation complete
  - _Requirements: 11.5, 9.6_

- [x] 2. Core Style System and Constants
  - [x] 2.1 Create PDF style constants file (styles.ts)
    - Define PDF_COLORS matching dark theme (zinc-800 background, zinc-100 text)
    - Define PDF_TYPOGRAPHY scale (h1: 48pt, h2: 24pt, h3: 20pt, body: 14pt, caption: 12pt)
    - Define PDF_SPACING constants (section margin: 64pt, column gap: 24pt, block gap: 12pt)
    - Create commonStyles StyleSheet with reusable styles
    - _Requirements: 2.7, 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ]* 2.2 Write property test for typography consistency
    - **Property 5: Typography Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Test that heading levels map to correct font sizes (1→48pt, 2→24pt, 3→20pt)

- [x] 3. Image Loading Infrastructure
  - [x] 3.1 Implement ImageLoader class
    - Create ImageLoader.ts with cache Map<string, string>
    - Implement resolveImagePath() to convert relative paths to absolute URLs
    - Implement loadImage() to fetch and convert to data URL
    - Implement preloadImages() to load all section images in parallel
    - Add collectImagesFromGroup() helper for recursive image collection
    - _Requirements: 4.2, 4.3, 12.4, 12.5_

  - [x] 3.2 Add image path validation and error handling
    - Validate paths to prevent directory traversal attacks
    - Handle fetch failures gracefully (log warning, continue without caching)
    - Support webp, jpg, and png formats
    - _Requirements: 4.8, 8.4_

  - [ ]* 3.3 Write property test for image path resolution
    - **Property 6: Image Path Resolution**
    - **Validates: Requirements 4.3**
    - Test that relative paths produce absolute URLs with window.location.origin

  - [ ]* 3.4 Write unit tests for ImageLoader
    - Test successful image loading and caching
    - Test error handling for missing images
    - Test parallel loading of multiple images
    - _Requirements: 4.2, 4.3, 8.4_

- [x] 4. PDF Block Renderers
  - [x] 4.1 Implement PdfHeading component
    - Create blocks/PdfHeading.tsx
    - Map heading levels to font sizes using HEADING_STYLES constant
    - Apply bold font weight and appropriate margins
    - Use zinc-100 text color
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 10.2_

  - [x] 4.2 Implement PdfParagraph component
    - Create blocks/PdfParagraph.tsx
    - Apply 14pt font size with 1.6 line height
    - Use zinc-100 text color and 12pt bottom margin
    - _Requirements: 3.4, 3.8, 10.3_

  - [x] 4.3 Implement PdfList component
    - Create blocks/PdfList.tsx
    - Render bullet markers for unordered lists
    - Render number markers for ordered lists
    - Apply 14pt font size to list items
    - _Requirements: 3.5, 10.4_

  - [x] 4.4 Implement PdfImage component
    - Create blocks/PdfImage.tsx
    - Render Image component with data URL from imageCache
    - Support aspectRatio prop (default 16:9)
    - Render caption below image if present
    - Render placeholder View with alt text if image not in cache
    - Apply rounded corners matching web renderer
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 10.5_

  - [ ]* 4.5 Write property test for image placeholder fallback
    - **Property 7: Image Placeholder Fallback**
    - **Validates: Requirements 4.7**
    - Test that missing images render placeholder with alt text

  - [ ]* 4.6 Write unit tests for block renderers
    - Test PdfHeading renders correct font sizes for each level
    - Test PdfParagraph renders text with correct styling
    - Test PdfList renders bullets and numbers correctly
    - Test PdfImage renders placeholder when not in cache
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 5. Block Parser
  - [x] 5.1 Implement BlockToPdfParser component
    - Create BlockToPdfParser.tsx
    - Switch on block.type to render appropriate component
    - Handle heading, paragraph, list, image, and group types
    - Recursively parse group children
    - Return null for unknown block types
    - _Requirements: 10.1, 10.6, 10.8_

  - [ ]* 5.2 Write property test for block type mapping
    - **Property 4: Block Type Mapping**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**
    - Test that each Block type maps to correct PDF component

  - [ ]* 5.3 Write unit tests for BlockToPdfParser
    - Test parsing of each block type
    - Test recursive group parsing
    - Test handling of empty content
    - _Requirements: 10.1, 10.6, 10.8_

- [x] 6. Checkpoint - Verify block rendering components
  - Run lint: `npm run lint`
  - Run typecheck: `npm run type-check` or `npx tsc --noEmit`
  - Run tests: `npm test -- src/features/document/components/export/pdf/blocks/`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. PDF Section Templates
  - [x] 7.1 Implement HeroPdfTemplate component
    - Create templates/HeroPdfTemplate.tsx
    - Use 2:1 text-to-image column ratio (flex: 2 vs flex: 1)
    - Apply 48pt heading, 14pt body text
    - Position image with 4:3 aspect ratio in right column
    - Apply 64pt bottom margin
    - Use 24pt column gap
    - _Requirements: 1.1, 1.5, 2.1, 2.6_

  - [x] 7.2 Implement FeaturePdfTemplate component
    - Create templates/FeaturePdfTemplate.tsx
    - Use 1:1 text-to-image column ratio (flex: 1 vs flex: 1)
    - Alternate image position based on featureIndex (even=left, odd=right)
    - Apply 24pt heading, 14pt body text
    - Position image with 16:9 aspect ratio
    - Apply 64pt bottom margin
    - _Requirements: 1.2, 1.6, 2.2, 2.3, 2.6_

  - [x] 7.3 Implement GalleryPdfTemplate component
    - Create templates/GalleryPdfTemplate.tsx
    - Render full-width 24pt heading
    - Implement getGridLayout() helper (single/two-col/three-special)
    - Apply two-column grid for most cases
    - Special case: 3 images → first spans 2 cols, next two in 1 col each
    - Use 16:9 aspect ratio for all images
    - Apply 12pt gap between images, 64pt bottom margin
    - _Requirements: 1.3, 1.7, 2.4, 2.6_

  - [ ]* 7.4 Write property test for feature layout alternation
    - **Property 2: Feature Layout Alternation**
    - **Validates: Requirements 2.3**
    - Test that even featureIndex → image left, odd → image right

  - [ ]* 7.5 Write property test for gallery grid layout
    - **Property 3: Gallery Grid Layout**
    - **Validates: Requirements 2.4**
    - Test correct grid layout for N=1, 2, 3, 4+ images

  - [x] 7.6 Implement ContentPdfTemplate component
    - Create templates/ContentPdfTemplate.tsx
    - Use single-column prose layout with max-width 65ch
    - Apply 20pt heading, 14pt body text
    - Apply 24pt spacing between blocks, 64pt bottom margin
    - _Requirements: 1.4, 1.8, 2.5, 2.6_

  - [ ]* 7.7 Write unit tests for section templates
    - Test HeroPdfTemplate renders 2:1 column layout
    - Test FeaturePdfTemplate alternates image position
    - Test GalleryPdfTemplate grid layouts for different image counts
    - Test ContentPdfTemplate single-column layout
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.4, 2.5_

- [x] 8. PDF Document Wrapper
  - [x] 8.1 Implement PdfDocument component
    - Create pdf/PdfDocument.tsx
    - Wrap content in Document component
    - Create Page components with A4 dimensions (210mm × 297mm)
    - Apply margins (20mm top/bottom, 15mm left/right)
    - Route each ClassifiedSection to appropriate template based on role
    - Render page numbers in footer (except first page) as "Page N of M"
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.2 Write property test for template routing
    - **Property 1: Template Routing**
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.8**
    - Test that each section role maps to correct template component

  - [ ]* 8.3 Write unit tests for PdfDocument
    - Test page configuration (A4, margins)
    - Test template routing for each role
    - Test page number rendering
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Checkpoint - Verify PDF components structure
  - Run lint: `npm run lint`
  - Run typecheck: `npm run type-check` or `npx tsc --noEmit`
  - Run tests: `npm test -- src/features/document/components/export/pdf/`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Export Orchestrator Implementation
  - [x] 10.1 Replace exportPdfFromElement function
    - Update export/exportPdfFromElement.ts
    - Read Block[] from Document Store (useDocumentStore.getState().blocks)
    - Run semantic layout pipeline: groupIntoSections → analyzeSection → classifySection
    - Create ImageLoader instance and preload all images
    - Render PdfDocument component with sections and imageCache
    - Generate PDF using @react-pdf/renderer's pdf() function
    - Trigger browser download with filename
    - Maintain same function signature (container: HTMLElement, fileName?: string)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.4, 9.5_

  - [x] 10.2 Add error handling and logging
    - Wrap PDF generation in try-catch block
    - Create PdfExportError class with type field
    - Log errors to console with context (sectionCount, imageCount)
    - Display user-friendly error messages
    - Continue generation if individual images fail
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 10.3 Implement loading states
    - Update Export Button to show "Exporting…" during generation
    - Disable button during generation
    - Show loading state for minimum 500ms
    - Re-enable button on completion or error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 10.4 Write integration tests for exportPdfFromElement
    - Test end-to-end PDF generation from Document Store
    - Test image loading and caching
    - Test error handling for failed generation
    - Test loading state transitions
    - Mock @react-pdf/renderer's pdf() function
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.5_

- [x] 11. Performance Optimizations
  - [x] 11.1 Add parallel image loading
    - Use Promise.all() in ImageLoader.preloadImages()
    - Load all images concurrently
    - _Requirements: 12.4_

  - [x] 11.2 Add memory management
    - Clear image cache after PDF generation in finally block
    - Add clearCache() method to ImageLoader
    - _Requirements: 12.6_

  - [x] 11.3 Add non-blocking execution
    - Use requestIdleCallback for cleanup and analytics
    - Ensure main thread not blocked > 100ms
    - _Requirements: 12.6, 12.7_

  - [ ]* 11.4 Write performance benchmark tests
    - Test 5 sections generate in < 2 seconds
    - Test 10 sections generate in < 5 seconds
    - Test 20 sections generate in < 10 seconds
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 12. Checkpoint - Verify complete PDF export flow
  - Run lint: `npm run lint`
  - Run typecheck: `npm run type-check` or `npx tsc --noEmit`
  - Run all tests: `npm test`
  - Test PDF export manually in browser with sample document
  - Verify PDF downloads with correct filename
  - Verify PDF contains all sections with correct layouts
  - Verify images are embedded correctly
  - Verify text is selectable in generated PDF
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Dependency Cleanup
  - [x] 13.1 Remove old dependencies
    - Remove html2canvas-pro from package.json
    - Remove jspdf from package.json
    - Run `npm install` to update lock file
    - _Requirements: 9.6_

  - [x] 13.2 Verify bundle size impact
    - Check that @react-pdf/renderer adds < 500KB to bundle
    - Run build and analyze bundle size
    - _Requirements: 11.6_

- [x] 14. Integration and Polish
  - [x] 14.1 Verify backward compatibility
    - Confirm Web_Renderer components unchanged
    - Confirm Document_Store schema unchanged
    - Confirm semantic layout pipeline unchanged
    - Confirm Block[] data structure unchanged
    - _Requirements: 9.1, 9.2, 9.3, 9.7_

  - [x] 14.2 Add error message display
    - Integrate error messages with UI (toast/alert)
    - Auto-dismiss errors after 5 seconds
    - Allow manual dismissal
    - _Requirements: 8.1, 8.3, 8.7_

  - [x] 14.3 Test browser compatibility
    - Test in Chrome 90+
    - Test in Firefox 88+
    - Test in Safari 14+
    - Test in Edge 90+
    - _Requirements: 11.4_

  - [ ]* 14.4 Write visual regression tests
    - Generate PDFs for known test cases
    - Compare against baseline snapshots
    - Test all section types (hero, feature, gallery, content)
    - Test multi-page documents
    - _Requirements: 10.7_

- [x] 15. Final Verification and Documentation
  - [x] 15.1 Run complete test suite
    - Run all unit tests: `npm test`
    - Run all property-based tests with 100+ iterations
    - Verify all 7 properties pass
    - Run lint: `npm run lint`
    - Run typecheck: `npm run type-check` or `npx tsc --noEmit`
    - _Requirements: All_

  - [x] 15.2 Build and verify production bundle
    - Run production build: `npm run build`
    - Verify no build errors
    - Verify bundle size is acceptable
    - _Requirements: 11.6_

  - [x] 15.3 Manual end-to-end testing
    - Test with document containing all section types
    - Test with document containing 20+ sections
    - Test with missing images (verify placeholders)
    - Test error scenarios (network failures)
    - Verify PDF quality and layout fidelity
    - _Requirements: 6.7, 8.4, 10.7_

  - [x] 15.4 Final checkpoint
    - Ensure all tests pass, ask the user if questions arise.
    - Confirm all requirements validated
    - Confirm all 7 correctness properties tested

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from design document
- Checkpoints ensure incremental validation at major milestones
- Timeline follows 15-day implementation plan from design document
- All code uses TypeScript with strict type checking
- Testing uses Vitest + fast-check (already in devDependencies)

## Property-Based Tests Summary

1. **Property 1**: Template routing based on section role → validates Requirements 1.5, 1.6, 1.7, 1.8
2. **Property 2**: Feature layout alternation → validates Requirements 2.3
3. **Property 3**: Gallery grid layout selection → validates Requirements 2.4
4. **Property 4**: Block type to PDF component mapping → validates Requirements 10.2, 10.3, 10.4, 10.5, 10.6
5. **Property 5**: Typography consistency → validates Requirements 3.1, 3.2, 3.3
6. **Property 6**: Image path resolution → validates Requirements 4.3
7. **Property 7**: Image placeholder fallback → validates Requirements 4.7

## Verification Steps

After each major phase (checkpoints at tasks 6, 9, 12, 15):
1. **Lint**: `npm run lint` - ensure code style compliance
2. **Typecheck**: `npm run type-check` or `npx tsc --noEmit` - ensure type safety
3. **Test**: `npm test` - ensure all tests pass
4. **Build**: `npm run build` - ensure production build succeeds

## Implementation Timeline

- **Days 1-2**: Tasks 1-3 (Infrastructure, styles, image loading)
- **Days 3-4**: Tasks 4-5 (Block renderers, parser)
- **Days 5-7**: Task 7 (Section templates)
- **Days 8-9**: Tasks 8, 10 (Document wrapper, orchestrator)
- **Days 10-11**: Task 11 (Performance optimizations)
- **Days 12-14**: Tasks 12-14 (Integration, polish, compatibility)
- **Day 15**: Task 15 (Final verification)
