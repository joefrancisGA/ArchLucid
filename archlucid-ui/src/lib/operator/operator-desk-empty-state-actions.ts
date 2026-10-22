import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import type { EnterpriseCompactEmptyStateAction } from "@/components/EnterpriseCompactEmptyState";

const SAMPLE_REVIEW_HREF_MARKERS = ["/see-it", SHOWCASE_STATIC_DEMO_RUN_ID] as const;

const SAMPLE_REVIEW_LABEL_MARKERS = [
  "see a completed sample review",
  "load sample workspace",
  "view sample scorecard",
  "explore the sample review",
] as const;

/** True when an empty-state action points at marketing/sample review chrome. */
export function isSampleReviewEmptyStateAction(action: EnterpriseCompactEmptyStateAction): boolean {
  const href = action.href.trim().toLowerCase();
  const label = action.label.trim().toLowerCase();

  if (SAMPLE_REVIEW_HREF_MARKERS.some((marker) => href.includes(marker.toLowerCase()))) {
    return true;
  }

  return SAMPLE_REVIEW_LABEL_MARKERS.some((marker) => label.includes(marker));
}

export type EmptyStateActionsForDeskInput = {
  readonly actions: readonly EnterpriseCompactEmptyStateAction[] | undefined;
  readonly workingMode: boolean;
  readonly liveRecovery: boolean;
};

/** Working live operator hubs omit sample/marketing CTAs; Guided and demo keep them (RS-15). */
export function emptyStateActionsForDesk(input: EmptyStateActionsForDeskInput): readonly EnterpriseCompactEmptyStateAction[] {
  const actions = input.actions ?? [];

  if (!input.workingMode || !input.liveRecovery) {
    return actions;
  }

  return actions.filter((action) => !isSampleReviewEmptyStateAction(action));
}
