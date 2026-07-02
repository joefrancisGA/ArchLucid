"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { CorePilotProgressTrackerSummary } from "@/components/usability/CorePilotProgressTrackerSummary";
import {
  getCorePilotChecklistStorageServerSnapshot,
  getCorePilotChecklistStorageSnapshot,
  subscribeCorePilotChecklist,
} from "@/lib/core-pilot-checklist-storage";
import { OPERATOR_CARD, OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";
import { parseCorePilotProgressFromSnapshot } from "@/lib/usability/core-pilot-progress-tracker";
import { cn } from "@/lib/utils";

type OperatorHomeFirstReviewProgressCardProps = {
  readonly checklistVariant?: "full" | "compact";
};

/** Consolidated first-review progress card — merges the progress summary and checklist for operator home. */
export function OperatorHomeFirstReviewProgressCard(
  props: OperatorHomeFirstReviewProgressCardProps,
): React.JSX.Element | null {
  const checklistVariant = props.checklistVariant ?? "compact";
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [hydrated, setHydrated] = useState(false);
  const storageSnapshot = useSyncExternalStore(
    subscribeCorePilotChecklist,
    getCorePilotChecklistStorageSnapshot,
    getCorePilotChecklistStorageServerSnapshot,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || hasCommittedArchitectureReview) {
    return null;
  }

  const progress = parseCorePilotProgressFromSnapshot(storageSnapshot);

  if (progress.allDone) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-first-review-progress-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, OPERATOR_CARD.body, "space-y-4")}
      data-testid="operator-home-first-review-progress"
    >
      <CorePilotProgressTrackerSummary headingId="operator-home-first-review-progress-heading" />
      <CorePilotChecklist variant={checklistVariant} embedded />
    </section>
  );
}
