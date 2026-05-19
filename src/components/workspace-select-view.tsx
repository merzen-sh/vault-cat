import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useApp } from "@/stores/app";
import { useWorkspace } from "@/stores/workspace";

export function WorkspaceSelectView() {
  const { password, setView, error, setPassword } = useApp();
  const { setActive } = useWorkspace();
  const [workspaceNames, setWorkspaceNames] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const refresh = () => {
    invoke<string[]>("get_workspaces")
      .then((names) => {
        setWorkspaceNames(names);
        useWorkspace.getState().setWorkspaces(names);
      })
      .catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await invoke("create_workspace", { name: newName.trim(), password });
      setNewName("");
      setShowCreate(false);
      setCreateError(null);
      refresh();
    } catch (e) {
      setCreateError(String(e));
    }
  };

  const handleSelect = async (name: string) => {
    setUnlocking(name);
    try {
      await invoke("unlock_workspace", { name, password });
      setActive(name);
      setView("vault");
    } catch (e) {
      setPassword("");
      setView("auth");
    } finally {
      setUnlocking(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      {unlocking && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            <p className="text-sm text-muted-foreground">Deriving key and decrypting vault...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a workspace to unlock
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {workspaceNames.map((name) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              disabled={unlocking !== null}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left disabled:opacity-50"
            >
              <span className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {unlocking === name ? "Unlocking..." : "Click to unlock"}
                </p>
              </div>
              {unlocking === name ? (
                <svg className="animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          ))}

          {workspaceNames.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No workspaces yet. Create one to get started.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        {showCreate ? (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              autoFocus
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {createError && (
              <p className="text-xs text-destructive">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateError(null); }}
                className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2.5 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            + Add New Workspace
          </button>
        )}
      </div>
    </div>
  );
}
