import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT } from "@/lib/api/downloads-api";
import {
  deriveDecisionSnapshotSuppressedReason,
  isReviewPipelineIncomplete,
  type RunDetailWorkspaceStatus,
} from "@/lib/run-detail-workspace-derive";

/**
 * Shared source of truth for explaining why a primary CTA is disabled (TB-2190).
 * Prefer a visible WhyDisabledCtaHint over title-only tooltips for accessibility.
 */

export type WhyDisabledCtaReasonKind =
  | "role"
  | "lifecycle"
  | "prerequisite"
  | "busy"
  | "policy"
  | "incomplete-input";

export type WhyDisabledCtaReason = {
  readonly kind: WhyDisabledCtaReasonKind;
  readonly message: string;
};

export function formatWhyDisabledCtaMessage(
  reason: WhyDisabledCtaReason | null | undefined,
): string | null {
  if (reason === null || reason === undefined) {
    return null;
  }

  const trimmed = reason.message.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

export function firstWhyDisabledCtaReason(
  reasons: readonly (WhyDisabledCtaReason | null | undefined)[],
): WhyDisabledCtaReason | null {
  for (const reason of reasons) {

    if (formatWhyDisabledCtaMessage(reason) !== null && reason !== null && reason !== undefined) {
      return reason;
    }
  }

  return null;
}

export function whyDisabledNeedsRole(roleLabel: string): WhyDisabledCtaReason {
  return {
    kind: "role",
    message: `Requires ${roleLabel} to continue.`,
  };
}

export function whyDisabledNeedsLifecycle(stepLabel: string): WhyDisabledCtaReason {
  return {
    kind: "lifecycle",
    message: `Complete ${stepLabel} before continuing.`,
  };
}

export function whyDisabledNeedsPrerequisite(prerequisiteLabel: string): WhyDisabledCtaReason {
  return {
    kind: "prerequisite",
    message: `Requires ${prerequisiteLabel} before this action is available.`,
  };
}

export function whyDisabledBusy(actionLabel: string): WhyDisabledCtaReason {
  return {
    kind: "busy",
    message: `${actionLabel} is in progress.`,
  };
}

/**
 * Required fields are still blank or invalid (TB-2384).
 *
 * Distinct from the other kinds in who can clear it: role, lifecycle, and policy reasons need
 * someone or something else, whereas this one the user can fix in the form in front of them.
 * Callers pass the field list so the message names what is missing.
 */
export function whyDisabledIncompleteInput(missingFieldsMessage: string): WhyDisabledCtaReason {
  return {
    kind: "incomplete-input",
    message: missingFieldsMessage,
  };
}

export function whyDisabledLlmBudgetExhausted(): WhyDisabledCtaReason {
  return {
    kind: "policy",
    message: "AI budget for this workspace is exhausted. Open AI usage to review spend or raise the cap.",
  };
}

/** Execute-tier shell soft-disable for governance and integration mutation controls (TB-2359). */
export function whyDisabledEnterpriseMutationControl(): WhyDisabledCtaReason {
  return {
    kind: "role",
    message: enterpriseMutationControlDisabledTitle,
  };
}

/** Curated sample / static demo reviews have no backend-persisted export target. */
export function whyDisabledSampleReviewExport(): WhyDisabledCtaReason {
  return {
    kind: "policy",
    message: SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT,
  };
}

/** Share and Ask header actions stay off until the review pipeline produces assessable outcomes. */
export function whyDisabledReviewHeaderActions(
  workspaceStatus: RunDetailWorkspaceStatus,
): WhyDisabledCtaReason | null {
  if (!isReviewPipelineIncomplete(workspaceStatus)) {
    return null;
  }

  const message = deriveDecisionSnapshotSuppressedReason(workspaceStatus);

  if (message === null) {
    return whyDisabledNeedsLifecycle("the review");
  }

  return {
    kind: "lifecycle",
    message,
  };
}