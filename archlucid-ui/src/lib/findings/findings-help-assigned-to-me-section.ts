import { GOVERNANCE_ASSIGNED_TO_ME_SEARCH_EXCLUSIONS } from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const FINDINGS_HELP_ASSIGNED_TO_ME_SECTION_ID = "assigned-to-me" as const;

export const FINDINGS_HELP_ASSIGNED_TO_ME_SECTION_TITLE = "Assigned to me";

export const FINDINGS_HELP_ASSIGNED_TO_ME_INTRO =
  "Assigned to me is your personal queue of open findings where you are the remediation owner. Use the continue-oldest strip or open a row to work the next item. The tenant findings queue lists every tracked risk; this lane only shows work assigned to you.";

export const FINDINGS_HELP_ASSIGNED_TO_ME_EMPTY_BODY =
  `When nothing appears here, no open findings are assigned to you in this workspace. The page states how the list was searched (assigned-to-me register versus broader filters). ${GOVERNANCE_ASSIGNED_TO_ME_SEARCH_EXCLUSIONS}`;

export const SECURENOW_FINDINGS_HELP_ASSIGNED_TO_ME_INTRO =
  "My findings is your personal queue of open cloud-security findings assigned to you in this workspace. Use the continue-oldest strip or open a row to work the next item. The tenant findings queue lists every open finding; this lane only shows your assignments.";

export const SECURENOW_FINDINGS_HELP_ASSIGNED_TO_ME_EMPTY_BODY =
  `When nothing appears here, no open findings are assigned to you. The page states how the list was searched (assigned-to-me register versus broader filters). ${GOVERNANCE_ASSIGNED_TO_ME_SEARCH_EXCLUSIONS} When the tenant queue is also empty, confirm ARC-AMPE policy packs are assigned and Azure inventory is connected.`;

export function findingsHelpAssignedToMeIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_FINDINGS_HELP_ASSIGNED_TO_ME_INTRO
    : FINDINGS_HELP_ASSIGNED_TO_ME_INTRO;
}

export function findingsHelpAssignedToMeEmptyBody(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_FINDINGS_HELP_ASSIGNED_TO_ME_EMPTY_BODY
    : FINDINGS_HELP_ASSIGNED_TO_ME_EMPTY_BODY;
}
