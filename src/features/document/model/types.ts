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

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | ImageBlock
  | GroupBlock;

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
  | (Omit<GroupBlock, "id" | "children"> & {
      id?: string;
      children: RawBlockInput[];
    });
