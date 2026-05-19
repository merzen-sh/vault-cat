import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export type VaultTab = "secrets" | "recovery" | "settings";

interface VaultDataStore {
  secrets: Record<string, string>;
  recoveryFiles: Record<string, string>;
  activeTab: VaultTab;
  loading: boolean;

  setActiveTab: (tab: VaultTab) => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
  setSecret: (key: string, value: string) => void;
  deleteSecret: (key: string) => void;
  renameSecretKey: (oldKey: string, newKey: string) => void;
  addRecoveryFile: (name: string, content: string) => void;
  deleteRecoveryFile: (name: string) => void;
  renameRecoveryFile: (oldName: string, newName: string) => void;
}

export const useVaultData = create<VaultDataStore>((set, get) => ({
  secrets: {},
  recoveryFiles: {},
  activeTab: "secrets",
  loading: false,

  setActiveTab: (tab: VaultTab) => set({ activeTab: tab }),

  load: async () => {
    set({ loading: true });
    try {
      const data = await invoke<{ secrets: Record<string, string>; recovery_files: Record<string, string> }>(
        "get_vault_data"
      );
      set({
        secrets: data.secrets,
        recoveryFiles: data.recovery_files,
      });
    } catch {
      // not unlocked
    } finally {
      set({ loading: false });
    }
  },

  save: async () => {
    const { secrets, recoveryFiles } = get();
    try {
      await invoke("save_vault_data", { secrets, recoveryFiles });
    } catch {
      // ignore
    }
  },

  setSecret: (key: string, value: string) => {
    set((s) => ({ secrets: { ...s.secrets, [key]: value } }));
  },

  deleteSecret: (key: string) => {
    set((s) => {
      const next = { ...s.secrets };
      delete next[key];
      return { secrets: next };
    });
  },

  renameSecretKey: (oldKey: string, newKey: string) => {
    set((s) => {
      if (!(oldKey in s.secrets) || newKey in s.secrets) return s;
      const next = { ...s.secrets };
      next[newKey] = next[oldKey];
      delete next[oldKey];
      return { secrets: next };
    });
  },

  addRecoveryFile: (name: string, content: string) => {
    set((s) => ({
      recoveryFiles: { ...s.recoveryFiles, [name]: content },
    }));
  },

  deleteRecoveryFile: (name: string) => {
    set((s) => {
      const next = { ...s.recoveryFiles };
      delete next[name];
      return { recoveryFiles: next };
    });
  },

  renameRecoveryFile: (oldName: string, newName: string) => {
    set((s) => {
      if (!(oldName in s.recoveryFiles) || newName in s.recoveryFiles)
        return s;
      const next = { ...s.recoveryFiles };
      next[newName] = next[oldName];
      delete next[oldName];
      return { recoveryFiles: next };
    });
  },
}));
