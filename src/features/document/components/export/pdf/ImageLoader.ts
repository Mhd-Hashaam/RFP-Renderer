import type { ClassifiedSection, GroupBlock } from '@/features/document/model/types';

export type ImageEntry = {
  dataUrl: string;
  width: number;
  height: number;
  /** Natural aspect ratio: width / height */
  aspectRatio: number;
};

/**
 * Converts relative image paths to absolute URLs and loads them as data URLs.
 * @react-pdf/renderer requires absolute URLs or data URLs for images.
 */
export class ImageLoader {
  private cache: Map<string, ImageEntry> = new Map();

  /**
   * Preload all images from sections with sequential processing.
   * Returns a Map of src → ImageEntry for all successfully loaded images.
   * Failed images are logged but don't prevent PDF generation.
   * Processes images sequentially to avoid memory spikes.
   */
  async preloadImages(sections: ClassifiedSection[]): Promise<Map<string, ImageEntry>> {
    const imageSrcs = new Set<string>();

    // Collect all unique image sources
    for (const section of sections) {
      // Check heading (though headings don't have images in current schema)
      if (section.heading) {
        // No images in headings currently
      }

      // Check content blocks
      for (const block of section.content) {
        if (block.type === 'image') {
          imageSrcs.add(block.src);
        } else if (block.type === 'group') {
          this.collectImagesFromGroup(block, imageSrcs);
        }
      }
    }

    const imageSrcArray = Array.from(imageSrcs);
    console.log(`Processing ${imageSrcArray.length} images sequentially...`);

    // Load images sequentially to avoid memory spikes
    for (let i = 0; i < imageSrcArray.length; i++) {
      const src = imageSrcArray[i];
      try {
        console.log(`[${i + 1}/${imageSrcArray.length}] Processing: ${src}`);
        const entry = await this.loadImage(src);
        this.cache.set(src, entry);
      } catch (error) {
        // Log but don't fail - will use placeholder instead
        console.warn(`Failed to load image: ${src}`, error);
        // Don't set in cache - PdfImage will render placeholder
      }
    }

    console.log(`Successfully loaded ${this.cache.size}/${imageSrcArray.length} images`);
    return this.cache;
  }

  /**
   * Load a single image and convert to data URL.
   * Converts WebP images to JPEG since @react-pdf/renderer doesn't support WebP.
   * Throws if image cannot be loaded.
   */
  private async loadImage(src: string): Promise<ImageEntry> {
    const absoluteUrl = this.resolveImagePath(src);
    console.log(`Loading image: ${src} → ${absoluteUrl}`);

    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      console.error(`Failed to fetch ${absoluteUrl}: HTTP ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    console.log(`Loaded ${src}: ${Math.round(blob.size / 1024)}KB, type: ${blob.type}`);
    
    // If WebP, convert to JPEG using canvas (also captures dimensions)
    if (blob.type === 'image/webp') {
      console.log(`Converting WebP to JPEG: ${src}`);
      return this.convertWebPToJpeg(blob);
    }
    
    // For other formats (PNG, JPEG), read as data URL and measure dimensions
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Measure natural dimensions
        const img = new Image();
        img.onload = () => {
          resolve({
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight,
          });
        };
        img.onerror = reject;
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert WebP blob to JPEG data URL using canvas with compression and resizing.
   * @react-pdf/renderer doesn't support WebP format.
   * Resizes large images to max 1200px width to reduce memory usage.
   */
  private async convertWebPToJpeg(blob: Blob): Promise<ImageEntry> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          // Calculate target dimensions (max 1200px width for PDF quality)
          const MAX_WIDTH = 1200;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = Math.round(height * ratio);
          }

          console.log(`Resizing from ${img.naturalWidth}x${img.naturalHeight} to ${width}x${height}`);

          // Create canvas with target dimensions
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // Draw image to canvas with high quality
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 85% quality (good balance of size/quality)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          console.log(`Converted to JPEG: ${Math.round(dataUrl.length / 1024)}KB`);
          
          // Cleanup
          URL.revokeObjectURL(url);
          resolve({ dataUrl, width, height, aspectRatio: width / height });
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for conversion'));
      };

      img.src = url;
    });
  }

  /**
   * Convert relative path to absolute URL.
   * Validates path to prevent directory traversal attacks.
   */
  private resolveImagePath(src: string): string {
    // Prevent path traversal
    if (src.includes('..')) {
      throw new Error('Invalid image path: path traversal not allowed');
    }

    // Only allow specific directories or absolute URLs
    if (!src.startsWith('/Assets/') && !src.startsWith('http://') && !src.startsWith('https://')) {
      throw new Error('Image must be from /Assets/ directory or absolute URL');
    }

    // If already absolute URL, return as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }

    // Convert relative path to absolute URL
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const path = src.startsWith('/') ? src : `/${src}`;
    return `${base}${path}`;
  }

  /**
   * Recursively collect image sources from group blocks.
   */
  private collectImagesFromGroup(group: GroupBlock, imageSrcs: Set<string>): void {
    for (const child of group.children) {
      if (child.type === 'image') {
        imageSrcs.add(child.src);
      } else if (child.type === 'group') {
        this.collectImagesFromGroup(child, imageSrcs);
      }
    }
  }

  /**
   * Clear the image cache to free memory.
   * Should be called after PDF generation completes.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get the cached entry for an image source.
   * Returns undefined if image not in cache.
   */
  getCachedImage(src: string): ImageEntry | undefined {
    return this.cache.get(src);
  }
}
