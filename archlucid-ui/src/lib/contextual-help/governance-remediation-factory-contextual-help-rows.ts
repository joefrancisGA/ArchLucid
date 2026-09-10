/** Remediation factory — ranked queue and executive metrics (SH-07). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

const GOVERNANCE_REMEDIATION_FACTORY_PATH = "/governance/remediation-factory" as const;

const GOVERNANCE_REMEDIATION_PATTERNS_PATH = "/governance/remediation-patterns" as const;

const GOVERNANCE_REMEDIATION_FACTORY_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Remediation factory — explainable prioritization, executive metrics, and a ranked queue of operational security findings. Advisory only — no cloud apply.",
  whatToDoNext:
    "Select a priority row, run the score simulator to explain ranking, then follow the finding for remediation follow-up.",
  whyEmpty: "No open operational security findings to rank.",
  whereToConfigurePrerequisite:
    "Open findings and remediation patterns when pattern ExactMatch % or automation coverage needs attention.",
  whatToDoNextAction: {
    label: "Open assigned to me",
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: "Open remediation patterns",
    href: GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  },
  taskSteps: [
    "Review executive metrics for open findings, risk-weighted exposure, and pattern coverage.",
    "Select a priority row and run the advisory score simulator — not a live scanner feed.",
    "Follow the finding or open remediation patterns when coverage gaps block automation.",
  ],
} as const;

export const GOVERNANCE_REMEDIATION_FACTORY_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_REMEDIATION_FACTORY_PATH,
    entry: GOVERNANCE_REMEDIATION_FACTORY_HUB_CONTEXTUAL_HELP,
  },
];
