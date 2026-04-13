import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { Block } from "@/features/document/model/types";
import { groupIntoSections } from "@/features/document/intelligence/groupIntoSections";

const MAX_HISTORY = 50;

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

/** Push current blocks onto past stack, clear future */
function pushHistory(past: Block[][], current: Block[]): {
  past: Block[][];
  future: Block[][];
} {
  const next = [...past, current];
  return {
    past: next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next,
    future: [],
  };
}

export type DocumentStore = {
  blocks: Block[];
  past: Block[][];
  future: Block[][];
  canUndo: boolean;
  canRedo: boolean;
  setBlocks: (blocks: Block[]) => void;
  undo: () => void;
  redo: () => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  reorderSections: (activeSectionId: string, overSectionId: string) => void;
  moveBlock: (id: string, direction: "up" | "down") => void;
  updateHeading: (id: string, content: string) => void;
  updateParagraph: (id: string, content: string) => void;
  updateListItem: (id: string, itemIndex: number, value: string) => void;
  reorderListItems: (blockId: string, fromIndex: number, toIndex: number) => void;
};

export const useDocumentStore = create<DocumentStore>((set) => ({
  blocks: [],
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  setBlocks: (blocks) => set({ blocks, past: [], future: [], canUndo: false, canRedo: false }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const newFuture = [state.blocks, ...state.future];
      return {
        blocks: previous,
        past: newPast,
        future: newFuture.length > MAX_HISTORY ? newFuture.slice(0, MAX_HISTORY) : newFuture,
        canUndo: newPast.length > 0,
        canRedo: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const newPast = [...state.past, state.blocks];
      return {
        blocks: next,
        past: newPast.length > MAX_HISTORY ? newPast.slice(newPast.length - MAX_HISTORY) : newPast,
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      };
    }),

  reorderBlocks: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.blocks.findIndex((b) => b.id === activeId);
      const newIndex = state.blocks.findIndex((b) => b.id === overId);
      if (oldIndex < 0 || newIndex < 0) return state;
      const { past, future } = pushHistory(state.past, state.blocks);
      const blocks = arrayMove(state.blocks, oldIndex, newIndex);
      return { blocks, past, future, canUndo: true, canRedo: false };
    }),

  reorderSections: (activeSectionId, overSectionId) =>
    set((state) => {
      const sections = groupIntoSections(state.blocks);
      const fromIdx = sections.findIndex((s) => s.id === activeSectionId);
      const toIdx = sections.findIndex((s) => s.id === overSectionId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return state;
      const reordered = arrayMove(sections, fromIdx, toIdx);
      const newBlocks: Block[] = reordered.flatMap((s) => [
        ...(s.heading ? [s.heading] : []),
        ...s.content,
      ]);
      const { past, future } = pushHistory(state.past, state.blocks);
      return { blocks: newBlocks, past, future, canUndo: true, canRedo: false };
    }),

  moveBlock: (id, direction) =>
    set((state) => {
      const idx = state.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return state;
      const nextIndex = direction === "up" ? idx - 1 : idx + 1;
      if (nextIndex < 0 || nextIndex >= state.blocks.length) return state;
      const { past, future } = pushHistory(state.past, state.blocks);
      const blocks = arrayMove(state.blocks, idx, nextIndex);
      return { blocks, past, future, canUndo: true, canRedo: false };
    }),

  updateHeading: (id, content) =>
    set((state) => {
      const { past, future } = pushHistory(state.past, state.blocks);
      return {
        blocks: mapBlockTree(state.blocks, id, (block) => {
          if (block.type !== "heading") return block;
          return { ...block, content };
        }),
        past, future, canUndo: true, canRedo: false,
      };
    }),

  updateParagraph: (id, content) =>
    set((state) => {
      const { past, future } = pushHistory(state.past, state.blocks);
      return {
        blocks: mapBlockTree(state.blocks, id, (block) => {
          if (block.type !== "paragraph") return block;
          return { ...block, content };
        }),
        past, future, canUndo: true, canRedo: false,
      };
    }),

  updateListItem: (id, itemIndex, value) =>
    set((state) => {
      const { past, future } = pushHistory(state.past, state.blocks);
      return {
        blocks: mapBlockTree(state.blocks, id, (block) => {
          if (block.type !== "list") return block;
          const items = [...block.items];
          if (itemIndex < 0 || itemIndex >= items.length) return block;
          items[itemIndex] = value;
          return { ...block, items };
        }),
        past, future, canUndo: true, canRedo: false,
      };
    }),

  reorderListItems: (blockId, fromIndex, toIndex) =>
    set((state) => {
      const { past, future } = pushHistory(state.past, state.blocks);
      return {
        blocks: mapBlockTree(state.blocks, blockId, (block) => {
          if (block.type !== "list") return block;
          return { ...block, items: arrayMove(block.items, fromIndex, toIndex) };
        }),
        past, future, canUndo: true, canRedo: false,
      };
    }),
}));
