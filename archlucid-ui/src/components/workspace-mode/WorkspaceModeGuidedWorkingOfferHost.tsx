"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { WorkspaceModeGraduationOffer } from "@/components/workspace-mode/WorkspaceModeGraduationOffer";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  fetchUserPreferencesFromApi,
  USER_PREFERENCES_STALE_MS,
} from "@/lib/api/user-preferences";
import { isGuidedWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Opt-in Working invitation for Guided seats after first commit (FD-10). Never auto-switches. */
export function WorkspaceModeGuidedWorkingOfferHost(): React.JSX.Element | null {
  const { mode, setAndPersist } = useWorkspaceMode();
  const evalChrome = useProductionEvalChrome();
  const commitQuery = useCorePilotCommitContextQuery();
  const preferencesQuery = useQuery({
    queryKey: operatorQueryKeys.userPreferences,
    queryFn: fetchUserPreferencesFromApi,
    staleTime: USER_PREFERENCES_STALE_MS,
  });
  const [dismissedLocally, setDismissedLocally] = useState(false);

  if (dismissedLocally) {
    return null;
  }

  if (!evalChrome || !isGuidedWorkspaceMode(mode)) {
    return null;
  }

  const hasCommittedPackage = commitQuery.data?.hasCommittedManifest === true;

  if (!hasCommittedPackage) {
    return null;
  }

  const graduationOffer = preferencesQuery.data?.workspaceModeGraduationOffer ?? "pending";

  if (graduationOffer === "dismissed" || graduationOffer === "remind-next") {
    return null;
  }

  return (
    <div className="mb-4" data-testid="workspace-mode-guided-working-offer-host">
      <WorkspaceModeGraduationOffer
        onSwitchToWorking={() => {
          setAndPersist("working");
          setDismissedLocally(true);
        }}
        onDismiss={() => {
          setDismissedLocally(true);
        }}
      />
    </div>
  );
}
