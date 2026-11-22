import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "@/lib/governance/governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "@/lib/governance/governance-findings-bulk-selection-url";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import {
  FINDING_KEYBOARD_TRIAGE_ACTION_PARAM,
  FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM,
} from "@/lib/governance/finding-keyboard-triage-confirm-url";
import {
  GOVERNANCE_RECORD_CORRECTION_KIND_PARAM,
  GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM,
  GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM,
} from "@/lib/governance/governance-record-correction-confirm-url";

/** Sets review scope on the findings queue URL and clears conflicting architecture scope. */
export function governanceFindingsPickReviewForTriageHref(
  currentSearch: string,
  pathname: string,
  reviewId: string,
): string {
  const trimmedReviewId = reviewId.trim();

  if (trimmedReviewId.length === 0) {
    const currentParams = new URLSearchParams(currentSearch);
    const nextQuery = currentParams.toString();

    return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
  }

  const currentParams = new URLSearchParams(currentSearch);
  const hadArchitectureScope = currentParams.has("architectureId");
  const params = hadArchitectureScope
    ? new URLSearchParams()
    : new URLSearchParams(currentSearch);

  params.set("runId", trimmedReviewId);
  params.delete("architectureId");
  params.delete(GOVERNANCE_FINDINGS_BULK_PARAM);
  params.delete(GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM);
  params.delete(FINDING_KEYBOARD_TRIAGE_FINDING_ID_PARAM);
  params.delete(FINDING_KEYBOARD_TRIAGE_ACTION_PARAM);
  params.delete(GOVERNANCE_RECORD_CORRECTION_KIND_PARAM);
  params.delete(GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM);
  params.delete(GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM);
  params.delete(GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
