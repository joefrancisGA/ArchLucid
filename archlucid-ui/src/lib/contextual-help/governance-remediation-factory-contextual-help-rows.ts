/** Remediation factory — ranked queue and executive metrics (SH-07). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
} from "@/lib/governance/governance-route-paths";

const GOVERNANCE_REMEDIATION_PATTERNS_PATH = "/governance/remediation-patterns" as const;

const GOVERNANCE_REMEDIATION_FACTORY_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Remediation factory — explainable prioritization, executive metrics, attack path report, highest-leverage cut points (SA-10), ranked architect paths, and a priority queue of operational security findings. Advisory only — no cloud apply.",
  whatToDoNext:
    "Read the attack path report for vulnerable vs unevaluated paths, review cut points that collapse the most ranked paths, then select a ranked path or priority finding to inspect hops, rank breakdown, and optional simulator explanations. The same path inspect panel is on SecureNow Findings and Assigned to me when you select one queue row.",
  whyEmpty: "No open operational security findings to rank and no architect paths for the current scope.",
  whereToConfigurePrerequisite:
    "Inventory snapshots from Azure connections or extract and upload must exist before architect metrics, ranked paths, and path inspect panels populate.",
  whatToDoNextAction: {
    label: "Open assigned to me",
    href: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: "Open remediation patterns",
    href: GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  },
  taskSteps: [
    "Review executive metrics and architect outcome metrics (SA-11) — ordinal bands only, no percentage confidence.",
    "Use the attack path report and highest-leverage cut points to see vulnerable paths, evidence gaps, and choke points before opening individual rows.",
    "Select a ranked architect path or priority finding row; path inspect loads hops, rank, and optional simulator explanation (Alt+I focuses the panel here and on Findings / Assigned to me).",
    "Run the advisory score simulator on a finding when IE-15 ranking needs explanation — not a live scanner feed.",
    "Follow the finding or open remediation patterns when coverage gaps block automation.",
  ],
} as const;

export const GOVERNANCE_REMEDIATION_FACTORY_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: SECURENOW_REMEDIATION_FACTORY_PATH,
    entry: GOVERNANCE_REMEDIATION_FACTORY_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_REMEDIATION_FACTORY_PATH,
    entry: GOVERNANCE_REMEDIATION_FACTORY_HUB_CONTEXTUAL_HELP,
  },
];
