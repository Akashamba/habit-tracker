import { create } from "zustand";

interface ViewStore {
  compact: boolean;
  toggleView: () => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  compact: false,
  toggleView: () => set((state) => ({ compact: !state.compact })),
}));
