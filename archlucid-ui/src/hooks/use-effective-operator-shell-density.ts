"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { resolveArchitectWorkspaceChrome } from "@/lib/architect-workspace-chrome";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";

/**
 * Seat-level density: Working architects get full operator shell chrome without a deploy flag.
 * {@link isOperatorExperienceFullShellEnv} still wins from env/cookie when set.
 */
export function useEffectiveOperatorShellDensity(): {
  readonly isFullOperatorShell: boolean;
  readonly mounted: boolean;
} {
  const { mode, mounted } = useWorkspaceMode();
  const architectWorkspaceChrome = resolveArchitectWorkspaceChrome({ workspaceMode: mode });

  return {
    isFullOperatorShell: isOperatorExperienceFullShellEnv() || (mounted && architectWorkspaceChrome),
    mounted,
  };
}
