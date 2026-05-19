import { create } from "zustand";

interface SidebarStore {
  subOpen: boolean;
  toggleSub: () => void;
}

export const useSidebar = create<SidebarStore>((set) => ({
  subOpen: true,
  toggleSub: () => set((s) => ({ subOpen: !s.subOpen })),
}));
