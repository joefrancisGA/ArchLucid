import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_PATH,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_STEPS, FIRST_REVIEW_GUIDE_STEP_COUNT } from "@/lib/first-review-guide-steps";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import {
  areFinishSetupRequiredStepsComplete,
  resolveFinishSetupWizardDeploymentOptions,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";
import { BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR } from "@/lib/first-week-route-guidance";
import { FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE } from "@/lib/buyer/buyer-polish-copy";
import { formatStepProgressCompleteLabel } from "@/lib/step-progress-label";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type FirstReviewGuideStepUiStatus = "not-started" | "current" | "complete" | "blocked";

export type FirstReviewGuideReadinessKind =
  | "ready-to-start"
  | "required-setup-remains"
  | "in-progress"
  | "completed";

export type FirstReviewGuideReadiness = {
  readonly kind: FirstReviewGuideReadinessKind;
  readonly headline: string;
  readonly detail: string | null;
};

export type FirstReviewGuideRequiredBlocker = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly actionLabel: string;
};

export type FirstReviewGuideStepPresentation = {
  readonly index: number;
  readonly title: string;
  readonly explanation: string;
  readonly status: FirstReviewGuideStepUiStatus;
  readonly statusLabel: string;
  readonly actionLabel: string | null;
  readonly actionHref: string | null;
  readonly isNextStep: boolean;
};

export type FirstReviewGuideProgressPhase = "not-started" | "in-progress" | "complete";

export type FirstReviewGuideProgress = {
  readonly phase: FirstReviewGuideProgressPhase;
  readonly progressFraction: number;
  readonly summaryLabel: string;
  readonly detailLabel: string | null;
  readonly completedStepCount: number;
  readonly totalStepCount: number;
};

export type FirstReviewGuideHeaderActions = {
  readonly primaryLabel: string;
  readonly primaryHref: string;
  readonly primaryDisabled: boolean;
  readonly primaryDisabledReason: string | null;
  readonly secondaryLabel: string | null;
  readonly secondaryHref: string | null;
};

export type FirstReviewGuideOutcomeLink = {
  readonly label: string;
  readonly href: string;
};

export type FirstReviewGuideStateInput = {
  readonly commitContext: CorePilotCommitContext;
  readonly canExecute: boolean;
  readonly finishSetupContext: FinishSetupWizardContext | null;
  readonly finishSetupLoaded: boolean;
};

function reviewDetailHref(runId: string): string {
  return reviewDetailPath(runId);
}

function reviewFindingsHref(runId: string): string {
  return `${reviewDetailPath(runId)}?reviewTab=findings`;
}

function reviewDecisionsHref(runId: string): string {
  return `${reviewDetailPath(runId)}?reviewTab=decisions-remediation`;
}

function reviewFinalizeHref(runId: string): string {
  return `${reviewDetailPath(runId)}${BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR}`;
}

function reviewShareHref(runId: string): string {
  return `${reviewDetailPath(runId)}?reviewTab=review-package`;
}

export function resolveFirstReviewGuideRequiredBlockers(
  input: FirstReviewGuideStateInput,
): readonly FirstReviewGuideRequiredBlocker[] {
  const deployment = resolveFinishSetupWizardDeploymentOptions();
  const finishContext = input.finishSetupContext;

  if (!deployment.selfHosted || finishContext === null) {
    return [];
  }

  const healthStep = resolveFinishSetupWizardSteps(deployment).find((step) => step.id === "health");

  if (healthStep === undefined) {
    return [];
  }

  if (healthStep.isDone(finishContext)) {
    return [];
  }

  return [
    {
      id: "platform-health",
      title: "Platform health",
      description: "Required services must be healthy before your first review on a self-hosted deployment.",
      href: healthStep.href,
      actionLabel: healthStep.cta,
    },
  ];
}

export function resolveFirstReviewGuideReadiness(input: FirstReviewGuideStateInput): FirstReviewGuideReadiness {
  const { commitContext } = input;
  const blockers = resolveFirstReviewGuideRequiredBlockers(input);

  if (hasSealedReviewRecord(commitContext)) {
    return {
      kind: "completed",
      headline: "First review completed",
      detail: "Your finalized architecture review is ready to inspect and share.",
    };
  }

  if (blockers.length > 0) {
    return {
      kind: "required-setup-remains",
      headline: "One required setup item remains",
      detail: blockers[0]?.title ?? null,
    };
  }

  if (commitContext.latestRunId !== null) {
    return {
      kind: "in-progress",
      headline: "First review in progress",
      detail: "Continue where you left off — progress updates from your workspace reviews.",
    };
  }

  if (!input.canExecute) {
    return {
      kind: "ready-to-start",
      headline: "Ready to explore",
      detail:
        "Your role can read this guide and open the sample review. Ask a workspace administrator for review creation permission to begin your own review.",
    };
  }

  return {
    kind: "ready-to-start",
    headline: "Ready to start",
    detail: "Optional workspace setup can be completed later.",
  };
}

function hasSealedReviewRecord(commitContext: CorePilotCommitContext): boolean {
  return commitContext.firstCommittedRunId !== null;
}

function baseStepStatuses(commitContext: CorePilotCommitContext): FirstReviewGuideStepUiStatus[] {
  const hasRun = commitContext.latestRunId !== null;
  const readyToFinalize = commitContext.latestRunReadyToFinalize;
  const committed = hasSealedReviewRecord(commitContext);

  return [
    hasRun || committed ? "complete" : "not-started",
    hasRun || committed ? "complete" : "not-started",
    committed || readyToFinalize ? "complete" : hasRun ? "current" : "not-started",
    committed ? "complete" : readyToFinalize ? "current" : "not-started",
    committed ? "complete" : "not-started",
    committed ? "complete" : "not-started",
    committed ? "complete" : "not-started",
  ];
}

function statusLabel(status: FirstReviewGuideStepUiStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "current":
      return "Current";
    case "blocked":
      return "Blocked";
    case "not-started":
      return "Not started";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function resolveStepAction(
  stepIndex: number,
  commitContext: CorePilotCommitContext,
  canExecute: boolean,
): { readonly label: string | null; readonly href: string | null } {
  if (hasSealedReviewRecord(commitContext)) {
    return { label: null, href: null };
  }

  const latestRunId = commitContext.latestRunId;
  const latestRunHref = latestRunId !== null ? reviewDetailHref(latestRunId) : null;

  switch (stepIndex) {
    case 0:
      return canExecute && latestRunId === null
        ? { label: "Start review", href: REVIEWS_NEW_PATH }
        : { label: null, href: null };
    case 1:
      if (!canExecute) {
        return { label: null, href: null };
      }

      if (latestRunHref !== null) {
        return { label: "Add evidence", href: `${latestRunHref}?reviewTab=evidence` };
      }

      return { label: "Open evidence intake", href: REVIEWS_NEW_GUIDED_INTAKE_HREF };
    case 2:
      return latestRunHref !== null
        ? { label: "Open review", href: latestRunHref }
        : { label: null, href: null };
    case 3:
      if (latestRunId === null) {
        return { label: null, href: null };
      }

      return { label: "Open findings", href: reviewFindingsHref(latestRunId) };
    case 4:
      if (latestRunId === null) {
        return { label: null, href: null };
      }

      return { label: "Record decisions", href: reviewDecisionsHref(latestRunId) };
    case 5:
      if (latestRunId === null) {
        return { label: null, href: null };
      }

      return { label: "Seal review", href: reviewFinalizeHref(latestRunId) };
    case 6:
      return { label: "Explore sample review", href: reviewShareHref(SHOWCASE_STATIC_DEMO_RUN_ID) };
    default:
      return { label: null, href: null };
  }
}

function resolveCurrentStepIndex(statuses: readonly FirstReviewGuideStepUiStatus[]): number | null {
  const currentIndex = statuses.findIndex((status) => status === "current");

  if (currentIndex >= 0) {
    return currentIndex;
  }

  const firstIncomplete = statuses.findIndex((status) => status === "not-started");

  return firstIncomplete >= 0 ? firstIncomplete : null;
}

function countCompletedSteps(commitContext: CorePilotCommitContext): number {
  return baseStepStatuses(commitContext).filter((status) => status === "complete").length;
}

export function resolveFirstReviewGuideProgress(
  commitContext: CorePilotCommitContext,
): FirstReviewGuideProgress {
  const completedStepCount = countCompletedSteps(commitContext);
  const totalStepCount = FIRST_REVIEW_GUIDE_STEP_COUNT;
  const progressFraction = completedStepCount / totalStepCount;
  const stepProgressLabel = formatStepProgressCompleteLabel(completedStepCount, totalStepCount);

  if (hasSealedReviewRecord(commitContext)) {
    return {
      phase: "complete",
      progressFraction: 1,
      summaryLabel: FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE,
      detailLabel: null,
      completedStepCount: totalStepCount,
      totalStepCount,
    };
  }

  if (completedStepCount === 0) {
    return {
      phase: "not-started",
      progressFraction: 0,
      summaryLabel: "Not started",
      detailLabel: "Begin with step 1 when you are ready.",
      completedStepCount: 0,
      totalStepCount,
    };
  }

  return {
    phase: "in-progress",
    progressFraction,
    summaryLabel: "In progress",
    detailLabel: stepProgressLabel,
    completedStepCount,
    totalStepCount,
  };
}

export function resolveFirstReviewGuideSteps(
  input: FirstReviewGuideStateInput,
): readonly FirstReviewGuideStepPresentation[] {
  const statuses = baseStepStatuses(input.commitContext);
  const currentIndex = resolveCurrentStepIndex(statuses);

  return FIRST_REVIEW_GUIDE_STEPS.map((step, index) => {
    const action = resolveStepAction(index, input.commitContext, input.canExecute);

    return {
      index,
      title: step.title,
      explanation: step.explanation,
      status: statuses[index] ?? "not-started",
      statusLabel: statusLabel(statuses[index] ?? "not-started"),
      actionLabel: action.label,
      actionHref: action.href,
      isNextStep: currentIndex === index,
    };
  });
}

export function resolveFirstReviewGuideHeaderActions(
  input: FirstReviewGuideStateInput,
): FirstReviewGuideHeaderActions {
  const { commitContext, canExecute } = input;
  const liveShell = isLiveOperatorShellRecoveryContext();
  const sampleHref = liveShell ? null : reviewDetailHref(SHOWCASE_STATIC_DEMO_RUN_ID);
  const sampleSecondary =
    sampleHref !== null
      ? { secondaryLabel: "Explore sample review" as const, secondaryHref: sampleHref }
      : { secondaryLabel: null, secondaryHref: null };

  if (hasSealedReviewRecord(commitContext) && commitContext.firstCommittedRunId !== null) {
    return {
      primaryLabel: "Open sealed review record",
      primaryHref: reviewDetailHref(commitContext.firstCommittedRunId),
      primaryDisabled: false,
      primaryDisabledReason: null,
      secondaryLabel: "Start another review",
      secondaryHref: REVIEWS_NEW_PATH,
    };
  }

  if (commitContext.latestRunId !== null) {
    if (commitContext.latestRunReadyToFinalize) {
      return {
        primaryLabel: "Seal review",
        primaryHref: reviewDetailHref(commitContext.latestRunId),
        primaryDisabled: false,
        primaryDisabledReason: null,
        ...sampleSecondary,
      };
    }

    return {
      primaryLabel: "Continue review",
      primaryHref: reviewDetailHref(commitContext.latestRunId),
      primaryDisabled: false,
      primaryDisabledReason: null,
      ...sampleSecondary,
    };
  }

  return {
    primaryLabel: "Start first review",
    primaryHref: REVIEWS_NEW_PATH,
    primaryDisabled: !canExecute,
    primaryDisabledReason: canExecute
      ? null
      : liveShell
        ? "Review creation requires elevated workspace permissions. Ask your administrator."
        : "Review creation requires elevated workspace permissions. Ask your administrator or explore the sample review.",
    ...sampleSecondary,
  };
}

export function resolveOptionalWorkspaceSetupComplete(
  finishContext: FinishSetupWizardContext | null,
): boolean {
  if (finishContext === null) {
    return false;
  }

  return areFinishSetupRequiredStepsComplete(finishContext);
}

export function resolveFirstReviewGuideOutcomeLinks(runId: string): readonly FirstReviewGuideOutcomeLink[] {
  const baseHref = reviewDetailHref(runId);

  return [
    { label: "A sealed review record", href: baseHref },
    { label: "Evidence-backed findings", href: reviewFindingsHref(runId) },
    { label: "Recorded decisions and exceptions", href: reviewDecisionsHref(runId) },
    { label: "A shareable architecture package", href: reviewShareHref(runId) },
  ];
}
