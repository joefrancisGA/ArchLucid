"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { WorkspaceModeGraduationOffer } from "@/components/workspace-mode/WorkspaceModeGraduationOffer";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import {
  fetchUserPreferencesFromApi,
  USER_PREFERENCES_STALE_MS,
} from "@/lib/api/user-preferences";
import { isGuidedWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Shows the post-seal Working-mode offer when Guided mode is active and the offer is pending. */
export function WorkspaceModeGraduationOfferHost() {
  const { mode, setAndPersist } = useWorkspaceMode();
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

  if (!isGuidedWorkspaceMode(mode)) {
    return null;
  }

  const sealedReviewRecord = commitQuery.data?.sealedReviewRecord ?? null;

  if (sealedReviewRecord === null) {
    return null;
  }

  const graduationOffer = preferencesQuery.data?.workspaceModeGraduationOffer ?? "pending";

  if (graduationOffer === "dismissed" || graduationOffer === "remind-next") {
    return null;
  }

  return (
    <div className="mb-4" data-testid="workspace-mode-graduation-offer-host">
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
