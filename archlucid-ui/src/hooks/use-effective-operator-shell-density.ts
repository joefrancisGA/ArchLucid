"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";

/**
 * Seat-level density: Working mode enables full operator shell chrome without a deploy flag.
 * {@link isOperatorExperienceFullShellEnv} still wins from env/cookie when set.
 */
export function useEffectiveOperatorShellDensity(): {
  readonly isFullOperatorShell: boolean;
  readonly mounted: boolean;
} {
  const { isWorkingMode, mounted } = useWorkspaceMode();

  return {
    isFullOperatorShell: isOperatorExperienceFullShellEnv() || (mounted && isWorkingMode),
    mounted,
  };
}
