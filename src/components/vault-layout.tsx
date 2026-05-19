import { useEffect } from "react";
import { MainSidebar } from "@/components/main-sidebar";
import { SubSidebar } from "@/components/sub-sidebar";
import { Navbar } from "@/components/navbar";
import { VaultView } from "@/components/vault-view";
import { useVaultData } from "@/stores/vault-data";
import { useSettings, getSyncIntervalMs } from "@/stores/settings";
import { useApp } from "@/stores/app";

export function VaultLayout() {
  const { load } = useVaultData();
  const { autoSync } = useSettings();
  const { syncToCloud, syncing } = useApp();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ms = getSyncIntervalMs(autoSync);
    if (ms === null) return;

    const id = setInterval(() => {
      if (!syncing) syncToCloud();
    }, ms);

    return () => clearInterval(id);
  }, [autoSync, syncToCloud, syncing]);

  return (
    <div className="flex h-screen overflow-hidden">
      <MainSidebar />
      <SubSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <VaultView />
        </main>
      </div>
    </div>
  );
}
