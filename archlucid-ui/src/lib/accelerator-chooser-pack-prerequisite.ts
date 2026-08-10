import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";

export const ACCELERATOR_GREENFIELD_PACK_ID = "greenfield-web-app" as const;

export const ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE =
  "Needs a signed review record first." as const;

export function acceleratorPackRequiresSignedReviewRecord(packId: string): boolean {
  return packId !== ACCELERATOR_GREENFIELD_PACK_ID;
}

export function isAcceleratorPackBlockedByPrerequisite(
  status: AcceleratorChooserPrerequisiteStatus,
  packId: string,
): boolean {
  if (!acceleratorPackRequiresSignedReviewRecord(packId)) {
    return false;
  }

  return status !== "met";
}

export function prerequisiteNeedsPrimaryFirstReviewAction(
  status: AcceleratorChooserPrerequisiteStatus,
): boolean {
  return status === "not-met" || status === "unknown";
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
