/** Pilot outcomes sponsor report hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import {
  PILOT_OUTCOMES_CANONICAL_PATH,
  PILOT_OUTCOMES_HELP_CANONICAL_PATH,
} from "@/lib/pilot-outcomes-evidence-copy";
import { RETIRED_PILOT_OUTCOMES_PATH, SPONSOR_REPORT_PAGE_TITLE } from "@/lib/sponsor-report-navigation";

const LEGACY_PILOT_OUTCOMES_PATH = "/sponsor-report/pilot-outcomes" as const;

const PILOT_OUTCOMES_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Pilot outcomes — period summary of finalized review activity, material findings, governance decisions, and measurable pilot results.",
  whatToDoNext:
    `Set the reporting period, apply it, then open ${SPONSOR_REPORT_PAGE_TITLE} or ROI summary when you need sibling sponsor packaging.`,
  whyEmpty: "Outcomes fill in after you finalize architecture reviews in the selected period.",
  whereToConfigurePrerequisite:
    "Report windows use the current tenant, workspace, and project selected in the shell header.",
  whatToDoNextAction: {
    label: `Open ${SPONSOR_REPORT_PAGE_TITLE.toLowerCase()}`,
    href: PILOT_OUTCOMES_CANONICAL_PATH,
  },
  whereToConfigureAction: {
    label: "Open ROI summary",
    href: "/insights/roi-summary",
  },
} as const;

export const PILOT_OUTCOMES_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  // The route itself 404s after the merge; the row stays so bookmarked deep links still resolve help copy
  // that names the surviving sponsor report.
  {
    prefix: RETIRED_PILOT_OUTCOMES_PATH,
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
        "Pilot outcomes — how pilot-period summaries are read, what reporting windows mean, and how they differ from the ROI summary and architecture scorecard.",
      whatToDoNext: `Open ${SPONSOR_REPORT_PAGE_TITLE.toLowerCase()} to review the reporting period, then follow sibling reports when packaging needs a broader narrative.`,
      whyEmpty: "This guide is always available; outcomes appear after finalized reviews in the selected period.",
      whereToConfigurePrerequisite:
        "Reporting windows respect the workspace and project selected in the shell header.",
      whatToDoNextAction: {
        label: `Open ${SPONSOR_REPORT_PAGE_TITLE.toLowerCase()}`,
        href: PILOT_OUTCOMES_CANONICAL_PATH,
      },
    },
  },
];
