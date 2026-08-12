import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { FIRST_REVIEW_GUIDE_STEPS } from "@/lib/first-review-guide-steps";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import {
  areFinishSetupRequiredStepsComplete,
  resolveFinishSetupWizardDeploymentOptions,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";
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
};

export type FirstReviewGuideHeaderActions = {
  readonly primaryLabel: string;
  readonly primaryHref: string;
  readonly primaryDisabled: boolean;
  readonly primaryDisabledReason: string | null;
  readonly secondaryLabel: string;
  readonly secondaryHref: string;
};

export type FirstReviewGuideStateInput = {
  readonly commitContext: CorePilotCommitContext;
  readonly canExecute: boolean;
  readonly finishSetupContext: FinishSetupWizardContext | null;
  readonly finishSetupLoaded: boolean;
};

function reviewDetailHref(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId)}`;
}

function resolveShareHref(commitContext: CorePilotCommitContext): string {
  if (commitContext.firstCommittedRunId !== null) {
    return reviewDetailHref(commitContext.firstCommittedRunId);
  }

  return reviewDetailHref(SHOWCASE_STATIC_DEMO_RUN_ID);
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

  if (blockers.length > 0) {
    return {
      kind: "required-setup-remains",
      headline: "One required setup item remains",
      detail: blockers[0]?.title ?? null,
    };
  }

  if (commitContext.hasCommittedManifest) {
    return {
      kind: "completed",
      headline: "First review completed",
      detail: "Your finalized architecture review is ready to inspect and share.",
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

function baseStepStatuses(commitContext: CorePilotCommitContext): FirstReviewGuideStepUiStatus[] {
  const hasRun = commitContext.latestRunId !== null;
  const readyToFinalize = commitContext.latestRunReadyToFinalize;
  const committed = commitContext.hasCommittedManifest;

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
  const latestRunId = commitContext.latestRunId;
  const latestRunHref = latestRunId !== null ? reviewDetailHref(latestRunId) : null;

  switch (stepIndex) {
    case 0:
      return canExecute
        ? { label: "Start review", href: "/architecture/reviews/new" }
        : { label: null, href: null };
    case 1:
      return canExecute && latestRunHref !== null
        ? { label: "Add evidence", href: latestRunHref }
        : canExecute
          ? { label: "Start review", href: "/architecture/reviews/new" }
          : { label: null, href: null };
    case 2:
      return latestRunHref !== null
        ? { label: "Open review", href: latestRunHref }
        : canExecute
          ? { label: "Start review", href: "/architecture/reviews/new" }
          : { label: null, href: null };
    case 3:
    case 4:
      return latestRunHref !== null
        ? { label: stepIndex === 3 ? "Review findings" : "Record decisions", href: latestRunHref }
        : { label: null, href: null };
    case 5:
      return latestRunHref !== null
        ? { label: "Finalize review", href: latestRunHref }
        : { label: null, href: null };
    case 6:
      return commitContext.hasCommittedManifest
        ? { label: "Open completed package", href: resolveShareHref(commitContext) }
        : { label: "Explore sample review", href: reviewDetailHref(SHOWCASE_STATIC_DEMO_RUN_ID) };
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

export function resolveFirstReviewGuideProgress(
  commitContext: CorePilotCommitContext,
): FirstReviewGuideProgress {
  if (commitContext.hasCommittedManifest) {
    return {
      phase: "complete",
      progressFraction: 1,
      summaryLabel: "Complete",
      detailLabel: "Your first architecture review is finalized.",
    };
  }

  if (commitContext.latestRunId !== null) {
    return {
      phase: "in-progress",
      progressFraction: 0.5,
      summaryLabel: "In progress",
      detailLabel: "Continue from the walkthrough below.",
    };
  }

  return {
    phase: "not-started",
    progressFraction: 0,
    summaryLabel: "Not started",
    detailLabel: "Begin with step 1 when you are ready.",
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
  const sampleHref = reviewDetailHref(SHOWCASE_STATIC_DEMO_RUN_ID);

  if (commitContext.hasCommittedManifest && commitContext.firstCommittedRunId !== null) {
    return {
      primaryLabel: "Open completed package",
      primaryHref: reviewDetailHref(commitContext.firstCommittedRunId),
      primaryDisabled: false,
      primaryDisabledReason: null,
      secondaryLabel: "Explore sample review",
      secondaryHref: sampleHref,
    };
  }

  if (commitContext.latestRunId !== null) {
    if (commitContext.latestRunReadyToFinalize) {
      return {
        primaryLabel: "Finalize review",
        primaryHref: reviewDetailHref(commitContext.latestRunId),
        primaryDisabled: false,
        primaryDisabledReason: null,
        secondaryLabel: "Explore sample review",
        secondaryHref: sampleHref,
      };
    }

    return {
      primaryLabel: "Continue review",
      primaryHref: reviewDetailHref(commitContext.latestRunId),
      primaryDisabled: false,
      primaryDisabledReason: null,
      secondaryLabel: "Explore sample review",
      secondaryHref: sampleHref,
    };
  }

  return {
    primaryLabel: "Start first review",
    primaryHref: "/architecture/reviews/new",
    primaryDisabled: !canExecute,
    primaryDisabledReason: canExecute
      ? null
      : "Review creation requires elevated workspace permissions. Ask your administrator or explore the sample review.",
    secondaryLabel: "Explore sample review",
    secondaryHref: sampleHref,
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
