import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/stores/app";
import { useSettings } from "@/stores/settings";
import { AuthView } from "@/components/auth-view";
import { WorkspaceSelectView } from "@/components/workspace-select-view";
import { VaultLayout } from "@/components/vault-layout";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { view } = useApp();

  useEffect(() => {
    useSettings.getState().load();
    useApp.getState().init();
  }, []);

  switch (view) {
    case "auth":
      return <AuthView />;
    case "workspaces":
      return <WorkspaceSelectView />;
    case "vault":
      return <VaultLayout />;
  }
}
