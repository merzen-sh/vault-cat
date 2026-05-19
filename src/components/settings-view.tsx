import { useState, useRef, useEffect } from "react";
import { useSettings, type SyncInterval } from "@/stores/settings";

const options: { value: SyncInterval; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "5m", label: "Every 5 minutes" },
  { value: "15m", label: "Every 15 minutes" },
  { value: "30m", label: "Every 30 minutes" },
  { value: "1h", label: "Every hour" },
];

export function SettingsView() {
  const { autoSync, setAutoSync } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const current = options.find((o) => o.value === autoSync) ?? options[0];

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-lg font-semibold mb-4">App Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Auto-sync to cloud
          </label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Automatically sync your vault to Google Drive at a set interval.
          </p>

          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border bg-background text-sm hover:bg-accent transition-colors"
            >
              {current.label}
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
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {open && (
              <div className="absolute top-full left-0 mt-1 w-full rounded-md border border-border bg-popover shadow-lg z-50 py-1">
                {options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => {
                      setAutoSync(o.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors ${
                      o.value === autoSync ? "bg-accent font-medium" : ""
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
