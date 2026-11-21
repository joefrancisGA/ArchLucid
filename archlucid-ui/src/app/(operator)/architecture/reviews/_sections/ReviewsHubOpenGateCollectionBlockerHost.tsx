"use client";

import { OperatorHomeSecureNowCollectionBlockerStrip } from "@/components/operator-home/OperatorHomeSecureNowCollectionBlockerStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { REVIEWS_HUB_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-open-gate-collection-blocker-not-load-failure-copy";

export function ReviewsHubOpenGateCollectionBlockerHost(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <OperatorHomeSecureNowCollectionBlockerStrip
      workingMode={isWorkingMode}
      notLoadFailureTestId="reviews-hub-open-gate-collection-blocker-not-load-failure"
      notLoadFailureLine={REVIEWS_HUB_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE}
    />
  );
}
