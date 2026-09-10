import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_SECURITY_HOME_SECTION_HEADING = "Security" as const;

export const SECURENOW_SECURITY_HOME_SECTION_LEAD =
  "Triage assigned findings, run remediation factory workflows, and review remediation patterns." as const;

/** SecureNow home — operational security destinations (integration links live under Integration nav). */
export const SECURENOW_SECURITY_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
    summary: "Open findings assigned to you for remediation and follow-up.",
    recommendedFirst: true,
  },
  {
    href: "/governance/remediation-factory",
    label: OPERATOR_NAV_LINK_LABELS.remediationFactory,
    summary: "Prioritize remediation waves and review executive remediation metrics.",
  },
  {
    href: "/governance/remediation-patterns",
    label: OPERATOR_NAV_LINK_LABELS.remediationPatterns,
    summary: "Create, review, approve, and import remediation patterns for repeatable fixes.",
  },
];
