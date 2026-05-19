import { useState, useRef, useEffect } from "react";
import { useSidebar } from "@/stores/sidebar";
import { useWorkspace } from "@/stores/workspace";
import { useVaultData, type VaultTab } from "@/stores/vault-data";
import { useApp } from "@/stores/app";
import { invoke } from "@tauri-apps/api/core";

const navItems: { id: VaultTab | "settings"; label: string; icon: string }[] = [
  { id: "secrets", label: "Secrets & Tokens", icon: "K" },
  { id: "recovery", label: "Recovery Files", icon: "F" },
  { id: "settings", label: "Settings", icon: "G" },
];

export function SubSidebar() {
  const { subOpen } = useSidebar();
  const { active, renameActive } = useWorkspace();
  const { activeTab, setActiveTab } = useVaultData();
  const { lock } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(active.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === active.name) {
      setRenaming(false);
      setRenameValue(active.name);
      return;
    }
    try {
      await invoke("rename_workspace", { newName: trimmed });
      renameActive(trimmed);
    } catch {
      setRenameValue(active.name);
    }
    setRenaming(false);
  };

  return (
    <aside
      className={`flex flex-col bg-card overflow-hidden transition-all duration-200 ${
        subOpen ? "w-60" : "w-0"
      }`}
    >
      {renaming ? (
        <div className="shrink-0 p-2 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setRenameValue(active.name);
              }
            }}
            className="w-full px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      ) : (
        <div className="shrink-0 relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 font-semibold text-sm text-foreground border-b border-border hover:bg-accent/50 transition-colors"
          >
            <span className="truncate">{active.name}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute left-2 right-2 top-full mt-1 z-20 rounded-md border border-border bg-popover shadow-lg py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                    setRenameValue(active.name);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                  Rename workspace
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    lock();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Lock workspace
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as VaultTab)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left ${
              activeTab === item.id
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <span className="w-5 h-5 rounded bg-accent flex items-center justify-center text-xs font-semibold shrink-0">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
