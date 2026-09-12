import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_DOC_ANCHOR =
  "docs/architecture/adrs/0069-working-desk-one-work-object.md" as const;

export const SYSTEM_NOT_JOB_NO_SECOND_START_CTA_WORKING_OWNER = "SN-020" as const;

/** Working Home empty-state primary — one sequence verb, not Create vs Start review (ADR 0069). */
export const WORKING_HOME_SINGLE_START_PRIMARY_LABEL = WORKING_NEW_REVIEW_LABEL;

/** Bridge copy under the Working Home primary when no resume target exists. */
export const WORKING_HOME_NEW_REVIEW_BRIDGE_COPY =
  "Open the draft editor and add evidence when this architecture is ready to seal." as const;

/** Grep ratchet — peer start product labels must not appear on Working Home primaries. */
export const WORKING_HOME_BANNED_PEER_START_LABELS: readonly string[] = [
  "Create architecture",
  "Start review",
];

export function resolveWorkingHomeSingleStartPrimaryLabel(): string {
  return WORKING_HOME_SINGLE_START_PRIMARY_LABEL;
}

export function resolveWorkingHomeNewReviewBridgeCopy(): string {
  return WORKING_HOME_NEW_REVIEW_BRIDGE_COPY;
}
