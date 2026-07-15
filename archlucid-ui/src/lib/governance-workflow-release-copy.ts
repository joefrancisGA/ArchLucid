/** Buyer-facing governance release vocabulary — avoids CI/CD "promote" on the workflow page (TB-510). */

export const GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON = "Release to environment";

export const GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON_READER =
  "Release to environment (needs approver rights)";

export const GOVERNANCE_WORKFLOW_ENVIRONMENT_RELEASES_ACCORDION_LABEL =
  "Environment releases and activations";

export const GOVERNANCE_WORKFLOW_RELEASE_CONFIRM_TITLE = "Release review record to environment?";

export function governanceWorkflowReleaseConfirmDescription(
  manifestVersion: string,
  targetEnv: string,
): string {
  return `Releasing review record ${manifestVersion} to ${targetEnv}. This replaces the current active record in that environment.`;
}

export const GOVERNANCE_WORKFLOW_RELEASE_CONFIRM_BUTTON = "Release to environment";

export const GOVERNANCE_WORKFLOW_AUDIT_NAME_REQUIRED_BEFORE_RELEASE =
  "Enter your name for the audit trail before recording a governance release.";

export const GOVERNANCE_WORKFLOW_RELEASE_SUCCESS_TOAST =
  "Review released to target environment.";

export const GOVERNANCE_WORKFLOW_TIMELINE_LEAD =
  "Selected review timeline · governance releases newest first; activations follow.";

export const GOVERNANCE_WORKFLOW_NO_RELEASES_RECORDED_TITLE = "No governance releases recorded yet";

export const GOVERNANCE_WORKFLOW_RELEASE_CARD_TITLE_PREFIX = "Governance release";

export const GOVERNANCE_WORKFLOW_ACTIVATE_TOOLTIP_TARGET_ENV =
  "POST activation for this review record on the governance release target environment.";

export const GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_LABEL =
  "Your name for the audit trail (release and activate)";

export const GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_PLACEHOLDER =
  "Display name recorded with release and activate actions";

export const GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_HELPER =
  "This is stored with governance release and activation records alongside your signed-in account.";

export const GOVERNANCE_WORKFLOW_SUBMIT_CARD_DESCRIPTION_OPERATOR =
  "Starts an approval request so reviewers can release your finalized review record from a source environment toward a target (for example staging to production).";

export const GOVERNANCE_WORKFLOW_READER_LOAD_REVIEW_HINT =
  "Load a review in the approval section below to inspect approvals, governance releases, and environment activity.";

export const GOVERNANCE_WORKFLOW_RELEASE_RECORD_ID_SR_ONLY_PREFIX = "Governance release record id";
