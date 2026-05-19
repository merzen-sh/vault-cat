import { useApp } from "@/stores/app";
import { useSidebar } from "@/stores/sidebar";
import { useTheme } from "@/stores/theme";

export function MainSidebar() {
  const { view, lock } = useApp();
  const { toggleSub } = useSidebar();
  const { theme, toggle } = useTheme();

  return (
    <aside className="flex flex-col items-center w-14 bg-muted py-3 gap-2 shrink-0">
      <button
        onClick={toggleSub}
        className="w-9 h-9 rounded-xl bg-accent hover:bg-primary flex items-center justify-center text-foreground hover:text-primary-foreground text-sm transition-colors"
        title="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="w-8 h-px bg-border my-1" />

      <button
        className="w-9 h-9 rounded-2xl bg-primary hover:rounded-xl flex items-center justify-center text-primary-foreground text-xs font-semibold transition-all"
        title="Vault"
      >
        VC
      </button>

      <div className="flex-1" />

      {view === "vault" && (
        <button
          onClick={lock}
          className="w-9 h-9 rounded-xl bg-accent hover:bg-destructive flex items-center justify-center text-foreground hover:text-destructive-foreground transition-colors"
          title="Lock"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </button>
      )}

      <button
        onClick={toggle}
        className="w-9 h-9 rounded-xl bg-accent hover:bg-primary flex items-center justify-center text-foreground hover:text-primary-foreground transition-colors"
        title={theme === "light" ? "Dark mode" : "Light mode"}
      >
        {theme === "light" ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
    </aside>
  );
}
