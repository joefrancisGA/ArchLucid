import type { DraftRequestStatus } from "@/types/draft-intake";

/** Guided intake cannot submit (or advance to the submit step) from these server statuses. */
export function isGuidedIntakeDraftSubmitBlocked(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return status === "Submitted" || status === "RunSpawned";
}

export const ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE =
  "This architecture is already in review intake";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD =
  "The brief is frozen because this architecture is already in review intake. Continue in review intake to finish questions, or unlock to return it to drafting. After unlock you will confirm scope and start intake again.";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD =
  "This architecture is already submitted. Continue in review intake from there.";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL = "Continue in review intake";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL = "Unlock to edit this brief";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL = "Stay here";

export function isArchitectureDraftInReviewIntake(
  status: DraftRequestStatus | string | null | undefined,
): boolean {
  return status === "Admitted" || status === "Submitted";
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
