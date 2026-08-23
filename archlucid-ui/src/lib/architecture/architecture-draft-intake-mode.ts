import { architectureDraftPath, reviewDetailPath } from "@/lib/architecture/architecture-routes";

import type { DraftRequestStatus } from "@/types/draft-intake";

/** Guided intake cannot submit (or advance to the submit step) from these server statuses. */
export function isGuidedIntakeDraftSubmitBlocked(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return status === "Submitted" || status === "RunSpawned";
}

/** Guided intake must not mount for source architectures in these server statuses. */
export function isGuidedIntakeAccessBlocked(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return isGuidedIntakeDraftSubmitBlocked(status);
}

/** Brief fields stay frozen while intake is open or the package is already submitted. */
export function isArchitectureDraftBriefFrozen(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return status === "Admitted" || status === "Submitted";
}

export function resolveGuidedIntakeBlockedRedirectHref(
  architectureId: string,
  spawnedRunId: string | null | undefined,
): string {
  const trimmedRunId = spawnedRunId?.trim() ?? "";

  if (trimmedRunId.length > 0) {
    return reviewDetailPath(trimmedRunId);
  }

  return architectureDraftPath(architectureId);
}

export const ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE =
  "This architecture is already in review intake";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD =
  "The brief is frozen because this architecture is already in review intake. Continue in review intake to finish questions, or unlock to return it to drafting. After unlock you will confirm scope and start intake again.";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD =
  "This architecture already started a review. Open the existing review to continue, or wait for it to finish creating.";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL = "Continue in review intake";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL = "Unlock to edit this brief";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL = "Stay here";

export function isArchitectureDraftInReviewIntake(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return status === "Admitted";
}

export function architectureDraftAllowsBriefUnlock(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return status === "Admitted";
}

export function architectureDraftIntakeModeLead(
  status: DraftRequestStatus | string | null | undefined,
): string {
  if (status === "Submitted") {
    return ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD;
  }

  return ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD;
}
