import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";
import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

export const SECURENOW_COMPLIANCE_HOME_SECTION_HEADING = "Compliance" as const;

export const SECURENOW_COMPLIANCE_NAV_GROUP_LABEL = secureNowTitleCase("ARC-AMPE compliance");

export const SECURENOW_COMPLIANCE_HOME_SECTION_LEAD =
  "Choose frameworks, inspect effective rules, and trace controls to evidence." as const;

/** SecureNow home — surfaces ARC-AMPE and related compliance destinations. */
export const SECURENOW_COMPLIANCE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_POLICY_PACKS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_POLICY_PACKS_PATH],
    summary: "Choose the frameworks this workspace is measured against.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_STANDARDS_AND_RULES_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_STANDARDS_AND_RULES_PATH],
    summary: "See which rules apply here, and which ones conflict.",
  },
  {
    href: SECURENOW_AUDIT_EVIDENCE_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_AUDIT_EVIDENCE_PATH],
    summary: "Trace a control to the evidence behind it.",
  },
];
