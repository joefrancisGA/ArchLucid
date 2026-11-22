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

/** Removes review scope from the findings queue URL while preserving register and facet filters. */
export function governanceFindingsClearReviewScopeHref(
  currentSearch: string,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  params.delete("runId");
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
