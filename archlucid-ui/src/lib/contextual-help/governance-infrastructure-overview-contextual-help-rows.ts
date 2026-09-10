/** Infrastructure overview hub — exact path only so children keep their own rows (SH-10). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";

const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage: `Infrastructure overview — ${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_LEAD}`,
  whatToDoNext:
    "Open the resource explorer first when you need a single resource hub, linked audit evidence, or IDs for audit lineage lookup.",
  whyEmpty:
    "Evidence workbench destinations are listed here even before snapshots exist; snapshot-backed views stay empty until Azure inventory capture completes.",
  whereToConfigurePrerequisite:
    "Connect Azure or upload inventory with extract and upload before snapshot-backed workbenches show live evidence.",
  whatToDoNextAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  whereToConfigureAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  taskSteps: [
    GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY,
    "Open drift, diagrams, diagram reconciliation, Ask, or remediation instances from the workbench directory.",
    "Return here when you need the recommended first step or a directory of all six destinations.",
  ],
} as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_PATH,
    exactPathOnly: true,
    entry: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_CONTEXTUAL_HELP,
  },
];
