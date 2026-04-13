export type HeadingLevel = 1 | 2 | 3;

export type ListStyle = "ordered" | "unordered";

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: HeadingLevel;
  content: string;
};

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  content: string;
};

export type ListBlock = {
  id: string;
  type: "list";
  style: ListStyle;
  items: string[];
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  caption?: string;
};

export type GroupBlock = {
  id: string;
  type: "group";
  children: Block[];
};

export type MetaItem = {
  label: string;
  value: string;
};

export type MetaBlock = {
  id: string;
  type: "meta";
  items: MetaItem[];
};

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | ImageBlock
  | GroupBlock
  | MetaBlock;

export type BodyBlockType = "paragraph" | "list" | "image" | "group";

export type LayoutUnit = {
  /** Stable key for React: `unit:${headingId}` or block id for atomic units */
  id: string;
  blocks: Block[];
};

export type PageLayout = {
  columns: LayoutUnit[][];
};

export type RawBlockInput =
  | Omit<HeadingBlock, "id"> & { id?: string }
  | Omit<ParagraphBlock, "id"> & { id?: string }
  | Omit<ListBlock, "id"> & { id?: string }
  | Omit<ImageBlock, "id"> & { id?: string }
  | Omit<MetaBlock, "id"> & { id?: string }
  | (Omit<GroupBlock, "id" | "children"> & {
      id?: string;
      children: RawBlockInput[];
    });

// ─── Semantic Layout Engine — new types ──────────────────────────────────────

/** Device capability signal — replaces numeric column count. */
export type DeviceCapability = "mobile" | "tablet" | "desktop";

/** Position of a section within the full document. */
export type DocumentPosition = "first" | "middle" | "last";

/** Visual role assigned to a section by the intelligence layer. */
export type SectionRole = "hero" | "feature" | "gallery" | "content";

/** Emphasis level derived from section role. */
export type SectionEmphasis = "high" | "medium" | "low";

/** Layout hint derived from section role. */
export type LayoutHint = "wide" | "balanced" | "compact";

/** Visual intent computed for a section — drives template styling decisions. */
export type SectionIntent = {
  emphasis: SectionEmphasis;
  /** Integer in [1, 100]. Higher = more visual prominence. */
  visualWeight: number;
  layoutHint: LayoutHint;
};

/** A logical grouping of one optional heading and its following body blocks. */
export type Section = {
  /** Stable id: heading.id when heading present, else content[0].id. */
  id: string;
  heading: HeadingBlock | null;
  content: Block[];
};

/** Measurable properties of a section, computed before classification. */
export type SectionFeatures = {
  headingLevel: HeadingLevel | null;
  imageCount: number;
  paragraphCount: number;
  listCount: number;
  /** Sum of character lengths across heading, paragraphs, and list items. */
  totalTextLength: number;
  documentPosition: DocumentPosition;
};

/** A section extended with its classified role, intent, and feature index. */
export type ClassifiedSection = Section & {
  role: SectionRole;
  intent: SectionIntent;
  /** Zero-based position among non-hero sections — drives layout alternation. */
  featureIndex: number;
};

/** A page produced by the pagination engine — holds one or more sections. */
export type SectionPage = {
  sections: ClassifiedSection[];
};
