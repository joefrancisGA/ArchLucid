/** Governance findings queue surface and findings help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { FINDINGS_HELP_TOPIC_LABEL } from "@/lib/findings/findings-help-evidence-copy";
import { FINDINGS_HELP_PATH } from "@/lib/findings/findings-help-route";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

const FINDINGS_QUEUE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Track architecture risks from accepted findings, waivers, exceptions, and approval decisions.",
  whatToDoNext: "Assign owners, review aging risks, and clear expiring exceptions.",
  whyEmpty: "Rows appear after findings are accepted or approval decisions are recorded in reviews.",
  whereToConfigurePrerequisite:
    "Policy packs and approval workflow settings shape what becomes a tracked risk.",
} as const;

export const FINDINGS_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_FINDINGS_PATH,
    entry: FINDINGS_QUEUE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: FINDINGS_HELP_PATH,
    entry: {
      whatIsThisPage: `Findings — ${FINDINGS_HELP_TOPIC_LABEL.toLowerCase()} across inspection, severity, and governance resolution.`,
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
