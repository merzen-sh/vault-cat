import { create } from "zustand";

export type SyncInterval = "off" | "5m" | "15m" | "30m" | "1h";

const SYNC_INTERVAL_MS: Record<SyncInterval, number | null> = {
  off: null,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
};

export function getSyncIntervalMs(val: SyncInterval): number | null {
  return SYNC_INTERVAL_MS[val];
}

const STORAGE_KEY = "vault-cat-settings";

interface SettingsStore {
  autoSync: SyncInterval;
  setAutoSync: (val: SyncInterval) => void;
  load: () => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  autoSync: "off",

  setAutoSync: (val: SyncInterval) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, val);
    }
    set({ autoSync: val });
  },

  load: () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as SyncInterval | null;
    if (stored && ["off", "5m", "15m", "30m", "1h"].includes(stored)) {
      set({ autoSync: stored });
    }
  },
}));
