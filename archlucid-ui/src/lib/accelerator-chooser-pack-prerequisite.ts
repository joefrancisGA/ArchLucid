import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";

export const ACCELERATOR_GREENFIELD_PACK_ID = "greenfield-web-app" as const;

/** Persistent pack taxonomy — shown on every specialty pack card regardless of gate state. */
export const ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL = "Follow-up pack" as const;

/** Tenant gate only — specialty packs when prerequisite is not met. */
export const ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE =
  "Unlocks after you finalize your first architecture review in this tenant." as const;

/** @deprecated Use {@link ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL} + {@link ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE}. */
export const ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE =
  `${ACCELERATOR_FOLLOWUP_PACK_TAG_LABEL} — finalize your first architecture review in this tenant to unlock.` as const;

export const ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE =
  "Checking whether this tenant has a finalized review record…" as const;

export const ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE =
  "Finalized review record status is unavailable — verify access, then retry." as const;

export const ACCELERATOR_PACK_START_GREENFIELD_LABEL = "Start with this pack" as const;

export const ACCELERATOR_PACK_START_FOLLOWUP_LABEL = "Start follow-up review" as const;

export const ACCELERATOR_PACK_CTA_RETRY_LABEL = "Retry availability check" as const;

export type AcceleratorPackCtaState =
  | "ready"
  | "blocked-not-met"
  | "pending-checking"
  | "pending-unknown";

export type AcceleratorPackCtaRenderMode =
  | "start-link"
  | "locked-status"
  | "checking-status"
  | "retry-button";

export type AcceleratorPackCtaPresentation = {
  readonly mode: AcceleratorPackCtaRenderMode;
  readonly visibleLabel: string | null;
  readonly statusMessage: string | null;
  readonly usePrimaryVariant: boolean;
};

export function acceleratorPackRequiresSignedReviewRecord(packId: string): boolean {
  return packId !== ACCELERATOR_GREENFIELD_PACK_ID;
}

export function resolvePackCtaState(
  status: AcceleratorChooserPrerequisiteStatus,
  packId: string,
): AcceleratorPackCtaState {
  if (!acceleratorPackRequiresSignedReviewRecord(packId)) {
    return "ready";
  }

  switch (status) {
    case "met":
      return "ready";
    case "not-met":
      return "blocked-not-met";
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
        visibleLabel: isGreenfield
          ? ACCELERATOR_PACK_START_GREENFIELD_LABEL
          : ACCELERATOR_PACK_START_FOLLOWUP_LABEL,
        statusMessage: null,
        usePrimaryVariant: isGreenfield && status === "not-met",
      };
    case "blocked-not-met":
      return {
        mode: "locked-status",
        visibleLabel: null,
        statusMessage: ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE,
        usePrimaryVariant: false,
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
  status: AcceleratorChooserPrerequisiteStatus,
  packId: string,
): boolean {
  return resolvePackCtaState(status, packId) === "blocked-not-met";
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
      return "border-l-rose-600 dark:border-l-rose-500";
    case "checking":
    case "unknown":
      return "border-l-neutral-300 dark:border-l-neutral-600";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}
