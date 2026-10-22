"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { resolveArchitectWorkspaceChrome } from "@/lib/architect-workspace-chrome";

/** True when Working-mode professionals should see dense architect-workspace chrome (not buyer-polished demo shells). */
export function useArchitectWorkspaceChrome(): boolean {
  const { mode } = useWorkspaceMode();

  return resolveArchitectWorkspaceChrome({ workspaceMode: mode });
}
