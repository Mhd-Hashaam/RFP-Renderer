# Requirements Document

## Introduction

This document specifies requirements for replacing the broken PDF export system with @react-pdf/renderer. The current implementation uses html2canvas-pro + jspdf to capture screenshots of scrolling page cards, which produces mostly blank/black PDFs with broken scroll offset calculations. The new system will generate real PDFs with selectable text, proper layout fidelity, and reliable rendering using @react-pdf/renderer's declarative React components.

## Glossary

- **PDF_Generator**: The @react-pdf/renderer system that converts React components to PDF documents
- **PDF_Template**: A React component using @react-pdf/renderer primitives (Document, Page, View, Text, Image) that mirrors web section layouts
- **Section**: A logical grouping of one optional heading and its following body blocks (hero, feature, gallery, or content)
- **Classified_Section**: A Section extended with its role (hero/feature/gallery/content), intent, and feature index
- **Document_Store**: The Zustand store containing the Block[] array representing document content
- **Export_Button**: The "Export PDF" button in the DocumentApp toolbar
- **Web_Renderer**: The existing section components (HeroSection, FeatureSection, GallerySection, ContentSection) that render to HTML
- **Image_Asset**: Image files located in the public/Assets/ directory
- **Dark_Theme**: The zinc-900 card background with zinc-100 text color scheme
- **Layout_Fidelity**: The degree to which PDF output matches web version's visual hierarchy, spacing, and typography
- **Page_Break**: A boundary in the PDF where content continues on a new page
- **Loading_State**: Visual feedback shown during PDF generation
- **Error_Handler**: Component responsible for catching and displaying PDF generation failures

## Requirements

### Requirement 1: PDF Template Components

**User Story:** As a developer, I want PDF template components for all section types, so that the PDF output mirrors the web version's visual design.

#### Acceptance Criteria

1. THE PDF_Generator SHALL provide a HeroPdfTemplate component that renders hero sections with heading, body content, and optional image
2. THE PDF_Generator SHALL provide a FeaturePdfTemplate component that renders feature sections with alternating image-text layouts
3. THE PDF_Generator SHALL provide a GalleryPdfTemplate component that renders gallery sections with multi-image grids
4. THE PDF_Generator SHALL provide a ContentPdfTemplate component that renders content sections with heading and body blocks
5. WHEN a Classified_Section has role "hero", THE PDF_Generator SHALL use HeroPdfTemplate
6. WHEN a Classified_Section has role "feature", THE PDF_Generator SHALL use FeaturePdfTemplate
7. WHEN a Classified_Section has role "gallery", THE PDF_Generator SHALL use GalleryPdfTemplate
8. WHEN a Classified_Section has role "content", THE PDF_Generator SHALL use ContentPdfTemplate
9. FOR ALL PDF templates, THE PDF_Generator SHALL use @react-pdf/renderer primitives (View, Text, Image) exclusively

### Requirement 2: Layout Fidelity

**User Story:** As a user, I want the PDF to match the web version's appearance, so that the exported document looks professional and consistent.

#### Acceptance Criteria

1. THE PDF_Generator SHALL render hero sections with 2:1 text-to-image column ratio matching Web_Renderer desktop layout
2. THE PDF_Generator SHALL render feature sections with 1:1 text-to-image column ratio matching Web_Renderer desktop layout
3. THE PDF_Generator SHALL alternate feature section image position (left/right) based on featureIndex matching Web_Renderer behavior
4. THE PDF_Generator SHALL render gallery sections with multi-column image grids matching Web_Renderer desktop layout
5. THE PDF_Generator SHALL render content sections with single-column prose layout matching Web_Renderer
6. THE PDF_Generator SHALL apply spacing between sections matching Web_Renderer mb-16 (64px equivalent)
7. THE PDF_Generator SHALL apply Dark_Theme colors (zinc-900 backgrounds, zinc-100 text) to all PDF content
8. THE PDF_Generator SHALL use fixed desktop layout dimensions (no responsive breakpoints in PDF)

### Requirement 3: Typography System

**User Story:** As a user, I want readable text in the PDF, so that I can review and share the document effectively.

#### Acceptance Criteria

1. THE PDF_Generator SHALL render h1 headings at 48pt font size matching Web_Renderer text-5xl
2. THE PDF_Generator SHALL render h2 headings at 24pt font size matching Web_Renderer text-2xl
3. THE PDF_Generator SHALL render h3 headings at 20pt font size matching Web_Renderer text-xl
4. THE PDF_Generator SHALL render paragraph text at 14pt font size matching Web_Renderer text-base
5. THE PDF_Generator SHALL render list items at 14pt font size with appropriate bullet or number markers
6. THE PDF_Generator SHALL render image captions at 12pt italic font matching Web_Renderer text-xs
7. THE PDF_Generator SHALL use bold font weight for all headings
8. THE PDF_Generator SHALL use normal font weight for body text
9. THE PDF_Generator SHALL ensure all text is selectable in the generated PDF

### Requirement 4: Image Embedding

**User Story:** As a user, I want all images to appear in the PDF, so that the visual content is preserved.

#### Acceptance Criteria

1. WHEN a Section contains an ImageBlock, THE PDF_Generator SHALL embed the image in the PDF
2. THE PDF_Generator SHALL load Image_Assets from the public/Assets/ directory
3. THE PDF_Generator SHALL convert image paths to absolute URLs for @react-pdf/renderer compatibility
4. THE PDF_Generator SHALL maintain image aspect ratios matching Web_Renderer (4:3 for hero, 16:9 for feature/gallery)
5. THE PDF_Generator SHALL apply rounded corners to images matching Web_Renderer border-radius
6. WHEN an ImageBlock has a caption, THE PDF_Generator SHALL render the caption below the image
7. IF an image fails to load, THEN THE PDF_Generator SHALL render a placeholder rectangle with the alt text
8. THE PDF_Generator SHALL support webp, jpg, and png image formats

### Requirement 5: Page Management

**User Story:** As a user, I want multi-page PDFs with proper pagination, so that long documents are readable.

#### Acceptance Criteria

1. THE PDF_Generator SHALL create a new Page when content exceeds page height
2. THE PDF_Generator SHALL use A4 page dimensions (210mm x 297mm)
3. THE PDF_Generator SHALL apply consistent margins (20mm top/bottom, 15mm left/right) to all pages
4. THE PDF_Generator SHALL render page numbers in the footer of each page except the first
5. THE PDF_Generator SHALL format page numbers as "Page N of M" centered at bottom
6. THE PDF_Generator SHALL prevent Section headings from appearing alone at the bottom of a page (widow prevention)
7. THE PDF_Generator SHALL keep ImageBlocks with their captions on the same page
8. THE PDF_Generator SHALL allow Page_Breaks between sections but not within sections

### Requirement 6: Export Trigger Integration

**User Story:** As a user, I want to click the Export PDF button to generate the PDF, so that I can download my document.

#### Acceptance Criteria

1. WHEN the Export_Button is clicked, THE PDF_Generator SHALL read the current Block[] array from Document_Store
2. THE PDF_Generator SHALL run the semantic layout pipeline to produce Classified_Section[] array
3. THE PDF_Generator SHALL render all Classified_Sections using appropriate PDF_Templates
4. THE PDF_Generator SHALL generate the PDF document using @react-pdf/renderer's pdf() function
5. THE PDF_Generator SHALL trigger browser download of the generated PDF file
6. THE PDF_Generator SHALL use filename "rfp-document.pdf" by default
7. THE PDF_Generator SHALL complete PDF generation within 10 seconds for documents with up to 20 sections
8. THE PDF_Generator SHALL NOT modify the existing Web_Renderer or Document_Store during export

### Requirement 7: Loading States

**User Story:** As a user, I want to see progress during PDF generation, so that I know the system is working.

#### Acceptance Criteria

1. WHEN PDF generation starts, THE Export_Button SHALL display "Exporting…" text
2. WHILE PDF generation is in progress, THE Export_Button SHALL be disabled
3. WHEN PDF generation completes, THE Export_Button SHALL return to "Export PDF" text
4. WHEN PDF generation completes, THE Export_Button SHALL be re-enabled
5. THE PDF_Generator SHALL show Loading_State for minimum 500ms to prevent flashing
6. THE PDF_Generator SHALL update Loading_State within 100ms of generation start

### Requirement 8: Error Handling

**User Story:** As a user, I want clear error messages when PDF generation fails, so that I can understand what went wrong.

#### Acceptance Criteria

1. IF PDF generation fails, THEN THE Error_Handler SHALL display an error message to the user
2. THE Error_Handler SHALL log the full error details to the browser console
3. THE Error_Handler SHALL display user-friendly error messages (not raw stack traces)
4. WHEN an image fails to load, THE Error_Handler SHALL continue PDF generation with a placeholder
5. WHEN @react-pdf/renderer throws an error, THE Error_Handler SHALL catch it and display "PDF generation failed. Please try again."
6. WHEN PDF generation fails, THE Export_Button SHALL return to enabled state
7. THE Error_Handler SHALL clear error messages after 5 seconds or when user dismisses them

### Requirement 9: Backward Compatibility

**User Story:** As a developer, I want the new PDF system to integrate cleanly, so that existing functionality is not broken.

#### Acceptance Criteria

1. THE PDF_Generator SHALL NOT modify the Web_Renderer components (HeroSection, FeatureSection, GallerySection, ContentSection)
2. THE PDF_Generator SHALL NOT modify the Document_Store schema or actions
3. THE PDF_Generator SHALL NOT modify the semantic layout pipeline (classifySection, groupIntoSections, paginateSections)
4. THE PDF_Generator SHALL replace only the exportPdfFromElement function implementation
5. THE PDF_Generator SHALL maintain the same function signature for exportPdfFromElement (container: HTMLElement, fileName?: string)
6. THE PDF_Generator SHALL remove dependencies on html2canvas-pro and jspdf after implementation
7. THE PDF_Generator SHALL work with the existing Block[] data structure without schema changes

### Requirement 10: Parser and Serializer Requirements

**User Story:** As a developer, I want to transform Block[] data to PDF components, so that document content is rendered correctly.

#### Acceptance Criteria

1. THE PDF_Generator SHALL provide a BlockToPdfParser that converts Block objects to @react-pdf/renderer components
2. WHEN a Block has type "heading", THE BlockToPdfParser SHALL render a Text component with appropriate font size and weight
3. WHEN a Block has type "paragraph", THE BlockToPdfParser SHALL render a Text component with body text styling
4. WHEN a Block has type "list", THE BlockToPdfParser SHALL render Text components with bullet/number markers
5. WHEN a Block has type "image", THE BlockToPdfParser SHALL render an Image component with the src path
6. WHEN a Block has type "group", THE BlockToPdfParser SHALL recursively parse children blocks
7. FOR ALL valid Block objects, parsing to PDF components then rendering SHALL produce visual output matching Web_Renderer (round-trip visual fidelity)
8. THE BlockToPdfParser SHALL handle empty content strings gracefully without throwing errors

### Requirement 11: Client-Side Execution

**User Story:** As a developer, I want PDF generation to work client-side, so that no server infrastructure is required.

#### Acceptance Criteria

1. THE PDF_Generator SHALL execute entirely in the browser using @react-pdf/renderer's client-side API
2. THE PDF_Generator SHALL NOT require Next.js API routes or server-side rendering
3. THE PDF_Generator SHALL NOT make network requests during PDF generation (except for loading local Image_Assets)
4. THE PDF_Generator SHALL work in all modern browsers (Chrome, Firefox, Safari, Edge)
5. THE PDF_Generator SHALL use @react-pdf/renderer version 4.x or later
6. THE PDF_Generator SHALL bundle @react-pdf/renderer dependencies without exceeding 500KB additional bundle size

### Requirement 12: Performance Constraints

**User Story:** As a user, I want fast PDF generation, so that I can quickly export my documents.

#### Acceptance Criteria

1. THE PDF_Generator SHALL generate PDFs for documents with 5 sections in under 2 seconds
2. THE PDF_Generator SHALL generate PDFs for documents with 10 sections in under 5 seconds
3. THE PDF_Generator SHALL generate PDFs for documents with 20 sections in under 10 seconds
4. THE PDF_Generator SHALL process images in parallel when multiple Image_Assets are present
5. THE PDF_Generator SHALL cache loaded Image_Assets during a single export operation
6. THE PDF_Generator SHALL NOT block the main thread for more than 100ms continuously
7. THE PDF_Generator SHALL use requestIdleCallback or similar for non-critical processing when available
