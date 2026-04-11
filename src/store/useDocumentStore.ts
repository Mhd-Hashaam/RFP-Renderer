import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { Block } from "@/features/document/model/types";

function mapBlockTree(
  blocks: Block[],
  id: string,
  mapFn: (block: Block) => Block,
): Block[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return mapFn(block);
    }
    if (block.type === "group") {
      return {
        ...block,
        children: mapBlockTree(block.children, id, mapFn),
      };
    }
    return block;
  });
}

export type DocumentStore = {
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  moveBlock: (id: string, direction: "up" | "down") => void;
  updateHeading: (id: string, content: string) => void;
  updateParagraph: (id: string, content: string) => void;
  updateListItem: (id: string, itemIndex: number, value: string) => void;
};

export const useDocumentStore = create<DocumentStore>((set) => ({
  blocks: [],
  setBlocks: (blocks) => set({ blocks }),
  reorderBlocks: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.blocks.findIndex((b) => b.id === activeId);
      const newIndex = state.blocks.findIndex((b) => b.id === overId);
      if (oldIndex < 0 || newIndex < 0) return state;
      return { blocks: arrayMove(state.blocks, oldIndex, newIndex) };
    }),
  moveBlock: (id, direction) =>
    set((state) => {
      const idx = state.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return state;
      const nextIndex = direction === "up" ? idx - 1 : idx + 1;
      if (nextIndex < 0 || nextIndex >= state.blocks.length) return state;
      return { blocks: arrayMove(state.blocks, idx, nextIndex) };
    }),
  updateHeading: (id, content) =>
    set((state) => ({
      blocks: mapBlockTree(state.blocks, id, (block) => {
        if (block.type !== "heading") return block;
        return { ...block, content };
      }),
    })),
  updateParagraph: (id, content) =>
    set((state) => ({
      blocks: mapBlockTree(state.blocks, id, (block) => {
        if (block.type !== "paragraph") return block;
        return { ...block, content };
      }),
    })),
  updateListItem: (id, itemIndex, value) =>
    set((state) => ({
      blocks: mapBlockTree(state.blocks, id, (block) => {
        if (block.type !== "list") return block;
        const items = [...block.items];
        if (itemIndex < 0 || itemIndex >= items.length) return block;
        items[itemIndex] = value;
        return { ...block, items };
      }),
    })),
}));
