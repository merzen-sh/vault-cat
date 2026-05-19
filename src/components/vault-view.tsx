import { useState, useRef } from "react";
import { useVaultData } from "@/stores/vault-data";
import { SettingsView } from "@/components/settings-view";

export function VaultView() {
  const { activeTab, setActiveTab } = useVaultData();

  const tabs = [
    { id: "secrets" as const, label: "Secrets & Access Tokens" },
    { id: "recovery" as const, label: "Recovery Files" },
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "secrets" && <SecretsSection />}
        {activeTab === "recovery" && <RecoverySection />}
        {activeTab === "settings" && <SettingsView />}
      </div>
    </div>
  );
}

function SecretsSection() {
  const { secrets, setSecret, deleteSecret, renameSecretKey, save } = useVaultData();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameKeyValue, setRenameKeyValue] = useState("");

  const rows = Object.entries(secrets);

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setSecret(newKey.trim(), newValue.trim());
    await save();
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = async (key: string) => {
    deleteSecret(key);
    await save();
  };

  const handleEdit = async (key: string) => {
    setSecret(key, editValue);
    setEditing(null);
    await save();
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const toggleVisible = (key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g. GITHUB_TOKEN)"
            className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
        >
          Add
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No secrets yet. Add one above.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Key</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Value</th>
                <th className="w-28 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, value]) => (
                <tr key={key} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-2 font-mono text-xs text-foreground">
                    {renamingKey === key ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={renameKeyValue}
                          onChange={(e) => setRenameKeyValue(e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            if (!renameKeyValue.trim() || renameKeyValue.trim() === key) {
                              setRenamingKey(null);
                              return;
                            }
                            renameSecretKey(key, renameKeyValue.trim());
                            await save();
                            setRenamingKey(null);
                          }}
                          className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingKey(null)}
                          className="px-2 py-1 rounded border border-border text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer"
                        onDoubleClick={() => {
                          setRenamingKey(key);
                          setRenameKeyValue(key);
                        }}
                      >
                        {key}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {editing === key ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEdit(key)}
                          className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-2 py-1 rounded border border-border text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer"
                        onDoubleClick={() => {
                          setEditing(key);
                          setEditValue(value);
                        }}
                      >
                        {visible.has(key) ? value : "•".repeat(Math.min(value.length, 32))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleVisible(key)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={visible.has(key) ? "Hide" : "Show"}
                      >
                        {visible.has(key) ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(value)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(key)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecoverySection() {
  const { recoveryFiles, addRecoveryFile, deleteRecoveryFile, renameRecoveryFile, save } = useVaultData();
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameFileValue, setRenameFileValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      className="hidden"
      onChange={async (e) => {
        const files = Array.from(e.target.files ?? []);
        for (const file of files) {
          const text = await file.text();
          const name = file.name.replace(/\.[^.]+$/, "");
          addRecoveryFile(name, text);
        }
        await save();
        e.target.value = "";
      }}
    />
  );

  const rows = Object.entries(recoveryFiles);

  const handleAdd = async () => {
    if (!newName.trim() || !newContent.trim()) return;
    addRecoveryFile(newName.trim(), newContent.trim());
    await save();
    setNewName("");
    setNewContent("");
  };

  const handleDelete = async (name: string) => {
    deleteRecoveryFile(name);
    await save();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const toggleVisible = (name: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border-2 border-dashed border-border bg-card p-4 space-y-3"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={async (e) => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files);
          for (const file of files) {
            const text = await file.text();
            const name = file.name.replace(/\.[^.]+$/, "");
            addRecoveryFile(name, text);
          }
          await save();
        }}
      >
        {fileInput}
        <p className="text-xs text-muted-foreground text-center">
          Drag and drop files here, or{" "}
          <button
            className="text-primary underline underline-offset-2 hover:no-underline"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="File name (e.g. backup-codes)"
            className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newContent.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Add File
          </button>
        </div>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Paste recovery codes or file content here..."
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No recovery files yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(([name, content]) => (
            <div
              key={name}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                {renamingFile === name ? (
                  <div className="flex gap-1 flex-1 mr-2">
                    <input
                      type="text"
                      value={renameFileValue}
                      onChange={(e) => setRenameFileValue(e.target.value)}
                      className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      onClick={async () => {
                        if (!renameFileValue.trim() || renameFileValue.trim() === name) {
                          setRenamingFile(null);
                          return;
                        }
                        renameRecoveryFile(name, renameFileValue.trim());
                        await save();
                        setRenamingFile(null);
                      }}
                      className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingFile(null)}
                      className="px-2 py-1 rounded border border-border text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-medium">{name}</span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleVisible(name)}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title={visible.has(name) ? "Hide" : "Show"}
                  >
                    {visible.has(name) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  {renamingFile !== name && (
                    <button
                      onClick={() => {
                        setRenamingFile(name);
                        setRenameFileValue(name);
                      }}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Rename"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(content)}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(name)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <pre
                className={`p-4 text-xs font-mono whitespace-pre-wrap break-all transition-all ${
                  visible.has(name) ? "text-foreground" : "blur-sm select-none"
                }`}
              >
                {content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
