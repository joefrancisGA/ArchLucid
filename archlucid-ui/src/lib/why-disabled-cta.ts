import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

/**
 * Shared source of truth for explaining why a primary CTA is disabled (TB-2190).
 * Prefer a visible WhyDisabledCtaHint over title-only tooltips for accessibility.
 */

export type WhyDisabledCtaReasonKind =
  | "role"
  | "lifecycle"
  | "prerequisite"
  | "busy"
  | "policy";

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