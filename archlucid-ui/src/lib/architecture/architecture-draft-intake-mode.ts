import type { DraftRequestStatus } from "@/types/draft-intake";

/** True when the server has admitted or submitted the draft, so the brief is frozen. */
export function isArchitectureDraftInReviewIntake(status: DraftRequestStatus | null | undefined): boolean {
  return status === "Admitted" || status === "Submitted";
}

/** Admitted drafts can return to drafting. Submitted and spawned reviews cannot. */
export function architectureDraftAllowsBriefUnlock(status: DraftRequestStatus | null | undefined): boolean {
  return status === "Admitted";
}

export const ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE = "This architecture is already in review intake";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD =
  "The brief is frozen so review intake can continue. Continue intake, or unlock this architecture to edit it. Unlocking returns it to drafting — you will confirm scope and start intake again.";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD =
  "This architecture is already submitted for a review. Continue there instead of editing the brief here.";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL = "Continue in review intake";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL = "Unlock to edit this brief";

export const ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL = "Stay here";

export function architectureDraftIntakeModeLead(status: DraftRequestStatus | null | undefined): string {
  if (status === "Submitted") {
    return ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD;
  }

  return ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD;
}
