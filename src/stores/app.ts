import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type View = "auth" | "workspaces" | "vault";

interface AppStore {
  view: View;
  password: string;
  error: string | null;
  syncStatus: string | null;
  syncing: boolean;
  loading: boolean;
  setPassword: (pw: string) => void;
  setView: (v: View) => void;
  unlock: (pw: string) => Promise<void>;
  lock: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  clearError: () => void;
  init: () => Promise<void>;
}

let unlisten: (() => void) | null = null;

export const useApp = create<AppStore>((set) => ({
  view: "auth",
  password: "",
  error: null,
  syncStatus: null,
  syncing: false,
  loading: false,

  setPassword: (pw: string) => set({ password: pw }),
  setView: (v: View) => set({ view: v }),

  unlock: async (pw: string) => {
    set({ password: pw, error: null, syncStatus: null, loading: true });
    await new Promise((r) => setTimeout(r, 600));
    set({ view: "workspaces", loading: false });
  },

  lock: async () => {
    try {
      await invoke("lock_workspace");
    } catch {
      // ignore if no workspace unlocked
    }
    set({ view: "auth", password: "", error: null, syncStatus: null });
  },

  syncToCloud: async () => {
    set({ syncing: true, syncStatus: "Syncing...", error: null });
    try {
      await invoke("sync_workspace_to_cloud");
    } catch (e) {
      set({ error: String(e), syncing: false, syncStatus: null });
      setTimeout(() => set({ error: null }), 4000);
    }
  },

  clearError: () => set({ error: null }),

  init: async () => {
    if (unlisten) unlisten();
    unlisten = await listen<{ success: boolean; message: string }>("sync-result", (event) => {
      const { success, message } = event.payload;
      if (success) {
        set({ syncStatus: message, syncing: false });
        setTimeout(() => set({ syncStatus: null }), 4000);
      } else {
        set({ error: message, syncing: false, syncStatus: null });
        setTimeout(() => set({ error: null }), 4000);
      }
    });
  },
}));
