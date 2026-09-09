"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  resolveArchitectWorkspaceChrome,
  resolveWorkingForbidsBuyerPolish,
} from "@/lib/architect-workspace-chrome";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";

/**
 * Seat-level density: Working architects get full operator shell chrome without a deploy flag.
 * Dev cookie `buyer-polished` previews eval only on Guided — Working forbids buyer polish (ADR 0080 / WS-05).
 */
export function useEffectiveOperatorShellDensity(): {
  readonly isFullOperatorShell: boolean;
  readonly mounted: boolean;
} {
  const { mode, mounted } = useWorkspaceMode();
  const seatInput = { workspaceMode: mode };

  if (mounted && resolveWorkingForbidsBuyerPolish(seatInput)) {
    return {
      isFullOperatorShell: true,
      mounted,
    };
  }

  const architectWorkspaceChrome = resolveArchitectWorkspaceChrome(seatInput);

  return {
    isFullOperatorShell: isOperatorExperienceFullShellEnv() || (mounted && architectWorkspaceChrome),
    mounted,
  };
}
