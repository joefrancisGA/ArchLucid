/** Pilot outcomes sponsor report hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { PILOT_OUTCOMES_HELP_CANONICAL_PATH } from "@/lib/pilot-outcomes-evidence-copy";

const PILOT_OUTCOMES_PATH = "/insights/pilot-outcomes" as const;
const LEGACY_PILOT_OUTCOMES_PATH = "/sponsor-report/pilot-outcomes" as const;

const PILOT_OUTCOMES_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Pilot outcomes — period summary of finalized review activity, material findings, governance decisions, and measurable pilot results.",
  whatToDoNext:
    "Set the reporting period, apply it, then open Executive value report or ROI summary when you need sibling sponsor packaging.",
  whyEmpty: "Outcomes fill in after you finalize architecture reviews in the selected period.",
  whereToConfigurePrerequisite:
    "Report windows use the current tenant, workspace, and project selected in the shell header.",
  whatToDoNextAction: {
    label: "Open executive value report",
    href: "/insights/executive-summary",
  },
  whereToConfigureAction: {
    label: "Open ROI summary",
    href: "/insights/roi-summary",
  },
} as const;

export const PILOT_OUTCOMES_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: PILOT_OUTCOMES_PATH,
    entry: PILOT_OUTCOMES_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: LEGACY_PILOT_OUTCOMES_PATH,
    entry: PILOT_OUTCOMES_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: PILOT_OUTCOMES_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "Pilot outcomes — how pilot-period summaries are read, what reporting windows mean, and how they differ from executive value reports and ROI summary.",
      whatToDoNext: "Open pilot outcomes to review the reporting period, then follow sibling reports when packaging needs a broader narrative.",
      whyEmpty: "This guide is always available; outcomes appear after finalized reviews in the selected period.",
      whereToConfigurePrerequisite:
        "Reporting windows respect the workspace and project selected in the shell header.",
      whatToDoNextAction: {
        label: "Open pilot outcomes",
        href: PILOT_OUTCOMES_PATH,
      },
    },
  },
];
