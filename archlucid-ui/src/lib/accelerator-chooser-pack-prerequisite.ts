import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { isAcceleratorCostGovernancePackId } from "@/lib/accelerator-chooser";

export const ACCELERATOR_GREENFIELD_PACK_ID = "greenfield-web-app" as const;

/** Unified start CTA for every accelerator pack — first review or follow-up. */
export const ACCELERATOR_PACK_START_LABEL = "Start with this pack" as const;

/** Soft guidance on cost-policy packs — not a tenant gate. */
export const ACCELERATOR_COST_BASELINE_RECOMMENDATION =
  "Recommended after a finalized review with cloud inventory or cost baseline evidence." as const;

/** @deprecated Use {@link ACCELERATOR_PACK_START_LABEL}. */
export const ACCELERATOR_PACK_START_GREENFIELD_LABEL = ACCELERATOR_PACK_START_LABEL;

/** @deprecated Use {@link ACCELERATOR_PACK_START_LABEL}. */
export const ACCELERATOR_PACK_START_FOLLOWUP_LABEL = ACCELERATOR_PACK_START_LABEL;

export const ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE =
  "Checking whether this tenant has a finalized review record…" as const;

export const ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE =
  "Finalized review record status is unavailable — verify access, then retry." as const;

export const ACCELERATOR_PACK_CTA_RETRY_LABEL = "Retry availability check" as const;

export type AcceleratorPackCtaState =
  | "ready"
  | "pending-checking"
  | "pending-unknown";

export type AcceleratorPackCtaRenderMode =
  | "start-link"
  | "checking-status"
  | "retry-button";

export type AcceleratorPackCtaPresentation = {
  readonly mode: AcceleratorPackCtaRenderMode;
  readonly visibleLabel: string | null;
  readonly statusMessage: string | null;
  readonly usePrimaryVariant: boolean;
};

export function acceleratorPackShowsCostBaselineRecommendation(packId: string): boolean {
  return isAcceleratorCostGovernancePackId(packId);
}

export function resolvePackCtaState(
  status: AcceleratorChooserPrerequisiteStatus,
  _packId: string,
): AcceleratorPackCtaState {
  switch (status) {
    case "met":
    case "not-met":
      return "ready";
    case "checking":
      return "pending-checking";
    case "unknown":
      return "pending-unknown";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function resolvePackCtaPresentation(
  status: AcceleratorChooserPrerequisiteStatus,
  packId: string,
): AcceleratorPackCtaPresentation {
  const ctaState = resolvePackCtaState(status, packId);
  const isGreenfield = packId === ACCELERATOR_GREENFIELD_PACK_ID;

  switch (ctaState) {
    case "ready":
      return {
        mode: "start-link",
        visibleLabel: ACCELERATOR_PACK_START_LABEL,
        statusMessage: null,
        usePrimaryVariant: isGreenfield,
      };
    case "pending-checking":
      return {
        mode: "checking-status",
        visibleLabel: null,
        statusMessage: ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
        usePrimaryVariant: false,
      };
    case "pending-unknown":
      return {
        mode: "retry-button",
        visibleLabel: ACCELERATOR_PACK_CTA_RETRY_LABEL,
        statusMessage: ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
        usePrimaryVariant: false,
      };
    default: {
      const exhaustive: never = ctaState;

      return exhaustive;
    }
  }
}

export function isAcceleratorPackBlockedByPrerequisite(
  _status: AcceleratorChooserPrerequisiteStatus,
  _packId: string,
): boolean {
  return false;
}

export function prerequisiteNeedsPrimaryGreenfieldAction(
  status: AcceleratorChooserPrerequisiteStatus,
): boolean {
  return status === "not-met";
}

export function prerequisiteNeedsPrimaryFirstReviewAction(
  status: AcceleratorChooserPrerequisiteStatus,
): boolean {
  return status === "unknown";
}

export function prerequisiteNeedsRetryAction(status: AcceleratorChooserPrerequisiteStatus): boolean {
  return status === "unknown";
}

export function prerequisiteBorderAccentClass(status: AcceleratorChooserPrerequisiteStatus): string {
  switch (status) {
    case "met":
      return "border-l-emerald-600 dark:border-l-emerald-500";
    case "not-met":
      return "border-l-neutral-300 dark:border-l-neutral-600";
    case "checking":
    case "unknown":
      return "border-l-neutral-300 dark:border-l-neutral-600";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}
