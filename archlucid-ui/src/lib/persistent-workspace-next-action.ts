import type { CorePilotProgressSnapshot } from "@/lib/usability/core-pilot-progress-tracker";

export type PersistentWorkspaceNextAction = {
  readonly headline: string;
  readonly detail: string | null;
  readonly href: string;
  readonly actionLabel: string;
};

/** Resolves the single highlighted next action for the persistent workspace strip. */
export function resolvePersistentWorkspaceNextAction(
  progress: CorePilotProgressSnapshot,
  nextStepHref: string | null,
  nextStepLabel: string | null,
): PersistentWorkspaceNextAction | null {
  if (progress.allDone) {
    return null;
  }

  if (nextStepHref === null || nextStepLabel === null) {
    return {
      headline: "Continue your first review",
      detail: `${progress.completedCount} of ${progress.totalCount} steps complete`,
      href: "/architecture/first-review-guide",
      actionLabel: "Open guide",
    };
  }

  return {
    headline: "What should you do next?",
    detail: `${progress.completedCount} of ${progress.totalCount} steps complete`,
    href: nextStepHref,
    actionLabel: nextStepLabel,
  };
}
