import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  active: Workspace;
  setActive: (name: string, icon?: string) => void;
  setWorkspaces: (names: string[]) => void;
  renameActive: (newName: string) => void;
}

export const useWorkspace = create<WorkspaceStore>((set) => ({
  workspaces: [],
  active: { id: "", name: "No workspace", icon: "-" },
  setActive: (name: string, icon?: string) =>
    set({
      active: {
        id: name,
        name,
        icon: icon ?? name.charAt(0).toUpperCase(),
      },
    }),
  setWorkspaces: (names: string[]) =>
    set({
      workspaces: names.map((n) => ({
        id: n,
        name: n,
        icon: n.charAt(0).toUpperCase(),
      })),
    }),
  renameActive: (newName: string) =>
    set((s) => ({
      active: { ...s.active, id: newName, name: newName },
      workspaces: s.workspaces.map((w) =>
        w.id === s.active.id
          ? { ...w, id: newName, name: newName }
          : w
      ),
    })),
}));
