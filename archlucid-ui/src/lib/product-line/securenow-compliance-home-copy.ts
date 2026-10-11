import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_COMPLIANCE_HOME_SECTION_HEADING = "Compliance" as const;

export const SECURENOW_COMPLIANCE_NAV_GROUP_LABEL = "ARC-AMPE compliance" as const;

export const SECURENOW_COMPLIANCE_HOME_SECTION_LEAD =
  "Choose frameworks, inspect effective rules, and trace controls to evidence." as const;

/** SecureNow home — surfaces ARC-AMPE and related compliance destinations. */
export const SECURENOW_COMPLIANCE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_POLICY_PACKS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.policyPacks,
    summary: "Assign the bundled ARC-AMPE Architecture Themes pack and tune priority floors for cloud evidence scans.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_STANDARDS_AND_RULES_PATH,
    label: OPERATOR_NAV_LINK_LABELS.governanceResolution,
    summary: "Inspect effective ARC-AMPE rules, conflicts, and precedence for the active workspace scope.",
  },
  {
    href: SECURENOW_AUDIT_EVIDENCE_PATH,
    label: OPERATOR_NAV_LINK_LABELS.auditEvidenceLineage,
    summary: "Open deterministic audit control evidence chains, including ARC-AMPE export packages.",
  },
];
