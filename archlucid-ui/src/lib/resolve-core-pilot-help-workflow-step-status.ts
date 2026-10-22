import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import type { CorePilotHelpWorkflowStep } from "@/lib/core-pilot-help-guide-content";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type CorePilotHelpWorkflowStepStatusLabel =
  | "Not started"
  | "Available after review starts"
  | "In progress"
  | "Ready to finalize"
  | "Complete";

export type CorePilotHelpWorkflowStepStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: CorePilotHelpWorkflowStepStatusLabel;
};

/** True when latestRunId is a distinct review from the finalized package (CTA deep-links there). */
function hasNewerInProgressRun(ctx: CorePilotCommitContext): boolean {
  return (
    ctx.latestRunId !== null &&
    ctx.firstCommittedRunId !== null &&
    ctx.latestRunId !== ctx.firstCommittedRunId
  );
}

function lockedAfterReviewStarts(): CorePilotHelpWorkflowStepStatus {
  return { kind: "draft", label: "Available after review starts" };
}

/** True when the step cannot be acted on until a review exists (steps 3–5 on an empty workspace). */
export function isCorePilotHelpWorkflowStepLocked(
  step: CorePilotHelpWorkflowStep,
  ctx: CorePilotCommitContext,
): boolean {
  if (ctx.latestRunId !== null || ctx.hasCommittedManifest) {
    return false;
  }

  return step.stepNumber >= 3;
}

/**
 * Maps the five help-guide workflow steps to buyer-facing status tags from commit context.
 * Pair with {@link resolveCorePilotHelpWorkflowStepCta} in the stepper.
 */
export function resolveCorePilotHelpWorkflowStepStatus(
  step: CorePilotHelpWorkflowStep,
  ctx: CorePilotCommitContext,
): CorePilotHelpWorkflowStepStatus {
  const stepNumber = step.stepNumber;
  const newerInProgress = hasNewerInProgressRun(ctx);

  if (stepNumber === 1) {
    if (ctx.latestRunId !== null || ctx.hasCommittedManifest) {
      return { kind: "ready", label: "Complete" };
    }

    return { kind: "draft", label: "Not started" };
  }

  if (stepNumber === 2) {
    if (newerInProgress && !ctx.latestRunReadyToFinalize) {
      return { kind: "in-progress", label: "In progress" };
    }

    if (ctx.hasCommittedManifest || ctx.latestRunReadyToFinalize) {
      return { kind: "ready", label: "Complete" };
    }

    if (ctx.latestRunId !== null) {
      return { kind: "in-progress", label: "In progress" };
    }

    return { kind: "draft", label: "Not started" };
  }

  if (stepNumber === 3) {
    if (newerInProgress && !ctx.latestRunReadyToFinalize) {
      return { kind: "in-progress", label: "In progress" };
    }

    if (ctx.hasCommittedManifest || ctx.latestRunReadyToFinalize) {
      return { kind: "ready", label: "Complete" };
    }

    if (ctx.latestRunId !== null) {
      return { kind: "in-progress", label: "In progress" };
    }

    return lockedAfterReviewStarts();
  }

  if (stepNumber === 4) {
    if (ctx.hasCommittedManifest && !newerInProgress) {
      return { kind: "ready", label: "Complete" };
    }

    if (ctx.latestRunReadyToFinalize) {
      return { kind: "needs-attention", label: "Ready to finalize" };
    }

    if (ctx.latestRunId !== null) {
      return { kind: "in-progress", label: "In progress" };
    }

    return lockedAfterReviewStarts();
  }

  if (stepNumber === 5) {
    if (ctx.hasCommittedManifest && !newerInProgress) {
      return { kind: "ready", label: "Complete" };
    }

    if (ctx.latestRunId !== null) {
      return { kind: "in-progress", label: "In progress" };
    }

    return lockedAfterReviewStarts();
  }

  return { kind: "draft", label: "Not started" };
}
