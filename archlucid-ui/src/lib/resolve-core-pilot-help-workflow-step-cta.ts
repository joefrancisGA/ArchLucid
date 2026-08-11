import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import type { CorePilotHelpWorkflowStep } from "@/lib/core-pilot-help-guide-content";
import { CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS } from "@/lib/core-pilot-help-guide-content";
import { BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR } from "@/lib/first-week-route-guidance";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";

export type CorePilotHelpWorkflowStepCta = {
  readonly enabled: boolean;
  readonly href: string | null;
  readonly label: string;
  readonly helperText: string | null;
};

/**
 * Shared gate for steps 3–5 before any review exists. Steps that resolve to this CTA are
 * collapsed into one note by the stepper instead of repeating an identical control per step.
 */
export const CORE_PILOT_HELP_START_REVIEW_FIRST_CTA: CorePilotHelpWorkflowStepCta = {
  enabled: true,
  href: "/architecture/reviews/new",
  label: "Start a review first",
  helperText: "Open detail, finalize, and exports unlock after you start a review.",
};

const START_REVIEW_FIRST: CorePilotHelpWorkflowStepCta = CORE_PILOT_HELP_START_REVIEW_FIRST_CTA;

/** TB-1331: step 2 without an active review — honest Start-first framing instead of a second Start disguised as evidence intake. */
export const CORE_PILOT_HELP_START_REVIEW_TO_ADD_EVIDENCE_CTA: CorePilotHelpWorkflowStepCta = {
  enabled: true,
  href: "/architecture/reviews/new",
  label: "Start a review to add evidence",
  helperText: "After you start a review, attach evidence on review detail.",
};

const START_REVIEW_TO_ADD_EVIDENCE: CorePilotHelpWorkflowStepCta =
  CORE_PILOT_HELP_START_REVIEW_TO_ADD_EVIDENCE_CTA;

/** TB-1333: resolver output while commit context is loading — stepper shows skeleton instead. */
const WORKFLOW_CONTEXT_PENDING_CTA: CorePilotHelpWorkflowStepCta = {
  enabled: false,
  href: null,
  label: CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS,
  helperText: null,
};

/** True when workspace commit context is still loading. */
export function isCorePilotHelpWorkflowContextPendingCta(
  cta: CorePilotHelpWorkflowStepCta | null,
): boolean {
  if (cta === null || cta === undefined) {
    return false;
  }

  return cta.label === CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS;
}

/** True when a resolved step CTA is the shared "no review yet" gate. */
export function isCorePilotHelpStartReviewFirstCta(
  cta: CorePilotHelpWorkflowStepCta | null,
): boolean {
  if (cta === null || cta === undefined) {
    return false;
  }

  return cta.label === CORE_PILOT_HELP_START_REVIEW_FIRST_CTA.label;
}

function reviewDetailHref(runId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId)}`;
}

function finalizeHref(runId: string): string {
  return `${reviewDetailHref(runId)}${BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR}`;
}

function exportsHref(runId: string): string {
  return `${reviewDetailHref(runId)}#artifacts-exports`;
}

function resolveMonitorCta(ctx: CorePilotCommitContext): CorePilotHelpWorkflowStepCta {
  if (ctx.latestRunId !== null) {
    return {
      enabled: true,
      href: reviewDetailHref(ctx.latestRunId),
      label: "Open review detail",
      helperText: null,
    };
  }

  if (ctx.firstCommittedRunId !== null) {
    return {
      enabled: true,
      href: reviewDetailHref(ctx.firstCommittedRunId),
      label: "Open review detail",
      helperText: null,
    };
  }

  return START_REVIEW_FIRST;
}

function resolveFinalizeCta(ctx: CorePilotCommitContext): CorePilotHelpWorkflowStepCta {
  if (ctx.latestRunReadyToFinalize && ctx.latestRunId !== null) {
    return {
      enabled: true,
      href: finalizeHref(ctx.latestRunId),
      label: "Finalize on review detail",
      helperText: null,
    };
  }

  // Prefer the newest in-progress run over an older committed package.
  if (ctx.latestRunId !== null && ctx.latestRunId !== ctx.firstCommittedRunId) {
    return {
      enabled: true,
      href: reviewDetailHref(ctx.latestRunId),
      label: "Open review detail",
      helperText: "Finalize unlocks when findings are ready on the review.",
    };
  }

  if (ctx.hasCommittedManifest && ctx.firstCommittedRunId !== null) {
    return {
      enabled: true,
      href: reviewDetailHref(ctx.firstCommittedRunId),
      label: "View finalized review",
      helperText: "This workspace already has a finalized review.",
    };
  }

  if (ctx.latestRunId !== null) {
    return {
      enabled: true,
      href: reviewDetailHref(ctx.latestRunId),
      label: "Open review detail",
      helperText: "Finalize unlocks when findings are ready on the review.",
    };
  }

  return START_REVIEW_FIRST;
}

function resolveShareCta(ctx: CorePilotCommitContext): CorePilotHelpWorkflowStepCta {
  if (ctx.hasCommittedManifest && ctx.firstCommittedRunId !== null) {
    return {
      enabled: true,
      href: exportsHref(ctx.firstCommittedRunId),
      label: "Open exports",
      helperText: null,
    };
  }

  if (ctx.latestRunId !== null) {
    return {
      enabled: true,
      href: reviewDetailHref(ctx.latestRunId),
      label: "Open review detail",
      helperText: "Exports unlock after you finalize the architecture review.",
    };
  }

  return START_REVIEW_FIRST;
}

/**
 * Resolves help-guide workflow CTAs from Core Pilot commit signals (TB-1042).
 * Steps 1–2 stay static; steps 3–5 never deep-link into an empty reviews list.
 */
function resolveEvidenceStepCta(ctx: CorePilotCommitContext): CorePilotHelpWorkflowStepCta {
  if (ctx.latestRunId !== null) {
    return {
      enabled: true,
      href: buildReviewDetailTabHref(ctx.latestRunId, "evidence"),
      label: "Add evidence on review detail",
      helperText: null,
    };
  }

  return START_REVIEW_TO_ADD_EVIDENCE;
}

export function resolveCorePilotHelpWorkflowStepCta(
  step: CorePilotHelpWorkflowStep,
  ctx: CorePilotCommitContext | null,
): CorePilotHelpWorkflowStepCta {
  if (step.stepNumber === 1) {
    return {
      enabled: false,
      href: null,
      label: step.ctaLabel,
      helperText: null,
    };
  }

  if (step.stepNumber === 2) {
    if (ctx === null) {
      return WORKFLOW_CONTEXT_PENDING_CTA;
    }

    return resolveEvidenceStepCta(ctx);
  }

  if (ctx === null) {
    return WORKFLOW_CONTEXT_PENDING_CTA;
  }

  if (step.stepNumber === 3) {
    return resolveMonitorCta(ctx);
  }

  if (step.stepNumber === 4) {
    return resolveFinalizeCta(ctx);
  }

  if (step.stepNumber === 5) {
    return resolveShareCta(ctx);
  }

  return {
    enabled: true,
    href: step.href,
    label: step.ctaLabel,
    helperText: null,
  };
}
