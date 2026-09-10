/** SecureNow Security shell home (`/`) — grouped destination cards. */

import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  SECURENOW_COMPLIANCE_HOME_SECTION_HEADING,
  SECURENOW_COMPLIANCE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-compliance-home-copy";
import {
  SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING,
  SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-infrastructure-home-copy";
import {
  SECURENOW_SECURITY_HOME_SECTION_HEADING,
  SECURENOW_SECURITY_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-security-home-copy";
import type { PageContextualHelpEntry } from "@/lib/contextual-help/types";

export const SECURENOW_HOME_CONTEXTUAL_HELP_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    `${OPERATOR_NAV_LINK_LABELS.home} — grouped ${SECURENOW_SECURITY_HOME_SECTION_HEADING}, ${SECURENOW_COMPLIANCE_HOME_SECTION_HEADING}, and ${SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING} destinations. ${SECURENOW_SECURITY_HOME_SECTION_LEAD} ${SECURENOW_COMPLIANCE_HOME_SECTION_LEAD} ${SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD}`,
  whatToDoNext:
    "Open findings assigned to you first, then assign ARC-AMPE policy packs or open the resource explorer for inventory evidence.",
  whyEmpty:
    "Assigned findings and inventory-backed workbenches stay empty until cloud evidence is connected and policy packs have run.",
  whereToConfigurePrerequisite:
    "Switch workspace or project scope from the header switcher when you work across teams.",
  whatToDoNextAction: {
    label: OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: OPERATOR_NAV_LINK_LABELS.policyPacks,
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Open findings assigned to you to continue the oldest remediation item.",
    "Assign ARC-AMPE policy packs and tune priority floors for cloud evidence scans.",
    "Open the resource explorer when you need a single resource hub or IDs for audit lineage lookup.",
  ],
};
