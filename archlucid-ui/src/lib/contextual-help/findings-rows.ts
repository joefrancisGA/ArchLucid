/** Policy findings queue surface and findings help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { FINDINGS_HELP_TOPIC_LABEL } from "@/lib/findings/findings-help-evidence-copy";
import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";

const FINDINGS_QUEUE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Track architecture risks from accepted findings, waivers, exceptions, and approval decisions.",
  whatToDoNext: "Assign owners, review aging risks, and clear expiring exceptions.",
  whyEmpty: "Rows appear after findings are accepted or approval decisions are recorded in reviews.",
  whereToConfigurePrerequisite:
    "Policy packs and approval workflow settings shape what becomes a tracked risk.",
  taskSteps: [
    "Open a finding to inspect evidence, severity, and owners.",
    "Assign owners and review aging risks.",
    "Clear expiring exceptions before they lapse.",
  ],
} as const;

const ASSIGNED_TO_ME_FINDINGS_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Your personal queue of open findings assigned to you for remediation and follow-up in this workspace.",
  whatToDoNext: "Open the continue-oldest strip or a row to work the next assigned finding.",
  whyEmpty:
    "Nothing is assigned to you yet — the queue uses the assigned-to-me register and excludes closed or other owners' rows.",
  whereToConfigurePrerequisite:
    "When the tenant queue is also empty, assign policy packs and confirm inventory evidence is connected.",
  whatToDoNextAction: {
    label: "Open tenant findings queue",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Use continue oldest when the strip is visible.",
    "Open a row to inspect evidence and owners.",
    "Return to policy packs when no findings exist because packs never ran.",
  ],
} as const;

export const FINDINGS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
    entry: ASSIGNED_TO_ME_FINDINGS_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_FINDINGS_PATH,
    entry: FINDINGS_QUEUE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: FINDINGS_HELP_PATH,
    entry: {
      whatIsThisPage: `Findings — ${FINDINGS_HELP_TOPIC_LABEL.toLowerCase()} across inspection, severity, and approval resolution.`,
      whatToDoNext:
        "Open the findings queue, search supporting evidence, or check the decision register for related outcomes.",
      whyEmpty: "This guide is always available; live findings appear after reviews produce architecture concerns.",
      whereToConfigurePrerequisite:
        "Findings respect the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open findings queue",
        href: GOVERNANCE_FINDINGS_PATH,
      },
      whereToConfigureAction: {
        label: "Search review evidence",
        href: "/insights/search-review-evidence",
      },
    },
  },
];
