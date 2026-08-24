import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";

export const ACCELERATOR_GREENFIELD_PACK_ID = "greenfield-web-app" as const;

export const ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE =
  "Follow-up pack — finalize your first architecture review in this tenant to unlock." as const;

export const ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE =
  "Checking whether this tenant has a finalized review record…" as const;

export const ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE =
  "Finalized review record status is unavailable — verify access, then retry." as const;

export type AcceleratorPackCtaState =
  | "ready"
  | "blocked-not-met"
  | "pending-checking"
  | "pending-unknown";

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
