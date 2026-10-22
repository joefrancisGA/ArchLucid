/** Approval setup surface. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { GOVERNANCE_SETUP_CANONICAL_PATH } from "@/lib/governance/governance-setup-evidence-copy";
import { GOVERNANCE_SETUP_PAGE_SUBTITLE } from "@/lib/governance/governance-setup-route";

export const GOVERNANCE_SETUP_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_SETUP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Approval setup — ${GOVERNANCE_SETUP_PAGE_SUBTITLE}`,
      whatToDoNext:
        "Complete policy, alert, approval, and sponsor-reporting steps, then open Findings or Policy packs when live configuration is ready.",
      whyEmpty: "Step status updates as you complete tracked setup actions in this workspace.",
      whereToConfigurePrerequisite:
        "Setup respects the workspace and project selected in the header switcher.",
      whatToDoNextAction: {
        label: "Open policy packs",
        href: "/governance/policy-packs",
      },
      taskSteps: [
        "Complete policy, alert, and approval setup steps in order.",
        "Open Policy packs when rule libraries need assignment.",
        "Open Findings when live risks appear after setup is complete.",
      ],
    },
  },
];

