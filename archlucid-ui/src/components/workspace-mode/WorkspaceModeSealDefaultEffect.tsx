"use client";

import { useEffect, useRef } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { fetchUserPreferencesFromApi } from "@/lib/api/user-preferences";
import { isGuidedWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { persistWorkspaceMode } from "@/lib/workspace-mode/workspace-mode-preference";

/**
 * After the user's first sealed review, default new sessions to Working unless they
 * explicitly saved Guided. Never overrides an explicit Guided preference.
 */
export function WorkspaceModeSealDefaultEffect() {
  const { mode, mounted, setAndPersist } = useWorkspaceMode();
  const commitQuery = useCorePilotCommitContextQuery();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!mounted || appliedRef.current) {
      return;
    }

    const sealedReviewRecord = commitQuery.data?.sealedReviewRecord ?? null;

    if (sealedReviewRecord === null) {
      return;
    }

    if (!isGuidedWorkspaceMode(mode)) {
      appliedRef.current = true;

      return;
    }

    void (async () => {
      const preferences = await fetchUserPreferencesFromApi();

      if (preferences.workspaceModeIsExplicit && isGuidedWorkspaceMode(preferences.workspaceMode)) {
        appliedRef.current = true;

        return;
      }

      if (!preferences.workspaceModeIsExplicit || isGuidedWorkspaceMode(preferences.workspaceMode)) {
        await persistWorkspaceMode("working");
        setAndPersist("working");
      }

      appliedRef.current = true;
    })();
  }, [commitQuery.data?.sealedReviewRecord, mode, mounted, setAndPersist]);

  return null;
}
