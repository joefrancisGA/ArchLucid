/** Remediation pattern registry — Draft import, submit, and SoD approval (SH-08). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

const GOVERNANCE_REMEDIATION_FACTORY_PATH = "/governance/remediation-factory" as const;

const GOVERNANCE_REMEDIATION_PATTERNS_PATH = "/governance/remediation-patterns" as const;

const GOVERNANCE_REMEDIATION_PATTERNS_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Remediation patterns — create, review, and approve governed remediation patterns with version history. YAML import always lands as Draft and is not eligible for production instances until approved by a different actor.",
  whatToDoNext:
    "Import YAML to create a Draft version, submit for review, then approve as a different actor — or open a pattern's version history.",
  whyEmpty: "No remediation patterns yet. Import YAML to create a Draft version.",
  whereToConfigurePrerequisite:
    "Pattern submit and approve needs Operate authority; approval requires a different actor than the author (separation of duties).",
  whatToDoNextAction: {
    label: "Open remediation factory",
    href: GOVERNANCE_REMEDIATION_FACTORY_PATH,
  },
  whereToConfigureAction: {
    label: "Open assigned findings",
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  },
  taskSteps: [
    "Import YAML to create a Draft pattern version — imports are never production-ready.",
    "Submit the version for review, then approve only as a different actor than the author.",
    "Open remediation factory to confirm ExactMatch % after patterns are approved.",
  ],
} as const;

export const GOVERNANCE_REMEDIATION_PATTERNS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_REMEDIATION_PATTERNS_PATH,
    entry: GOVERNANCE_REMEDIATION_PATTERNS_HUB_CONTEXTUAL_HELP,
  },
];
