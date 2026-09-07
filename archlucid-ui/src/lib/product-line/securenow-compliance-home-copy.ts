import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const SECURENOW_COMPLIANCE_HOME_SECTION_HEADING = "Compliance posture" as const;

export const SECURENOW_COMPLIANCE_HOME_SECTION_LEAD =
  "Assign ARC-AMPE architecture themes, review cloud-evidence findings, and export audit control lineage for CMS ACA and Medicaid partner diligence." as const;

import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

/** SecureNow home — surfaces ARC-AMPE and related compliance destinations. */
export const SECURENOW_COMPLIANCE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: GOVERNANCE_POLICY_PACKS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.policyPacks,
    summary: "Assign the bundled ARC-AMPE Architecture Themes pack and tune priority floors for cloud evidence scans.",
    recommendedFirst: true,
  },
  {
    href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
    label: OPERATOR_NAV_LINK_LABELS.governanceResolution,
    summary: "Inspect effective ARC-AMPE rules, conflicts, and precedence for the active workspace scope.",
  },
  {
    href: GOVERNANCE_FINDINGS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.findings,
    summary: "Triage open findings raised by ARC-AMPE rules against connected cloud inventory evidence.",
  },
  {
    href: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
    label: OPERATOR_NAV_LINK_LABELS.auditEvidenceLineage,
    summary: "Open deterministic audit control evidence chains, including ARC-AMPE export packages.",
  },
];
