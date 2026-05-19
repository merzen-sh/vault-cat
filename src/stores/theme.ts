import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export const useTheme = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),
  toggle: () => {
    const root = document.documentElement;
    root.classList.add("no-transition");

    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      root.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
      return { theme: next };
    });

    root.offsetHeight;
    root.classList.remove("no-transition");
  },
}));
