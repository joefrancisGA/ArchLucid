import { formatStepProgressCompleteLabel } from "@/lib/step-progress-label";
import type { CorePilotProgressSnapshot } from "@/lib/usability/core-pilot-progress-tracker";

export const PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE = "First review progress" as const;

export type PersistentWorkspaceNextAction = {
  readonly headline: string;
  readonly detail: string | null;
  readonly nextStepTitle: string | null;
  readonly href: string;
  readonly actionLabel: string;
};

/** Resolves the single highlighted next action for the persistent workspace strip. */
export function resolvePersistentWorkspaceNextAction(
  progress: CorePilotProgressSnapshot,
  nextStepHref: string | null,
  nextStepLabel: string | null,
  nextStepTitle: string | null = null,
): PersistentWorkspaceNextAction | null {
  if (progress.allDone) {
    return null;
  }

  const progressDetail = formatStepProgressCompleteLabel(progress.completedCount, progress.totalCount);

  if (nextStepHref === null || nextStepLabel === null) {
    return {
      headline: PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE,
      detail: progressDetail,
      nextStepTitle: null,
      href: "/architecture/first-review-guide",
      actionLabel: "Open guide",
    };
  }

  return {
    headline: PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE,
    detail: progressDetail,
    nextStepTitle,
    href: nextStepHref,
    actionLabel: nextStepLabel,
  };
}
