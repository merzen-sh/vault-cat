import { useApp } from "@/stores/app";

export function Navbar() {
  const { syncToCloud, lock, syncStatus, error, syncing } = useApp();

  return (
    <header className="flex items-center h-12 px-4 bg-background border-b border-border shrink-0 gap-2">
      <div className="flex-1" />

      {syncStatus && (
        <span
          className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${
            syncing
              ? "text-muted-foreground bg-muted"
              : "text-green-600 dark:text-green-400 bg-green-500/10"
          }`}
        >
          {syncing && (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
          )}
          {syncStatus}
        </span>
      )}
      {error && (
        <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          {error}
        </span>
      )}

      <button
        onClick={syncToCloud}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
        {syncing ? "Syncing..." : "Sync to Cloud"}
      </button>

      <button
        onClick={lock}
        disabled={syncing}
        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Lock workspace"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </button>
    </header>
  );
}
