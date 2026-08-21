/** ROI summary sponsor report hub and its help topic. */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { ROI_SUMMARY_HELP_CANONICAL_PATH } from "@/lib/roi-summary-help-evidence-copy";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

const ROI_SUMMARY_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Portfolio KPI view for review-cycle reduction, estimated effort saved, and governance-ready artifacts across a reporting window.",
  whatToDoNext:
    "Compare rolling 30-day and pilot-to-date windows, then review confidence and data needs before citing hours or dollars.",
  whyEmpty: "Estimates appear after finalized reviews or approval-check blocks exist in the selected period.",
  whereToConfigurePrerequisite:
    "Loaded hourly cost and review-cycle baseline inputs live on Baseline settings.",
  whatToDoNextAction: {
    label: "Open baseline settings",
    href: BASELINE_SETTINGS_CANONICAL_PATH,
  },
  whereToConfigureAction: {
    label: "Open sponsor report",
    href: SPONSOR_REPORT_PATH,
  },
} as const;

export const ROI_SUMMARY_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: SPONSOR_REPORT_ROI_SUMMARY_PATH,
    entry: ROI_SUMMARY_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: "/sponsor-report/roi-summary",
    entry: ROI_SUMMARY_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: ROI_SUMMARY_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage:
        "ROI summary — how portfolio savings framing is read, what windows mean, and how it differs from scorecard and baseline surfaces.",
      whatToDoNext: "Open ROI summary to review the reporting window, then follow methodology when assumptions need drill-down.",
      whyEmpty: "This guide is always available; estimates appear after finalized reviews in the selected period.",
      whereToConfigurePrerequisite:
        "Baseline settings capture loaded hourly cost and review-cycle inputs used in the estimate.",
      whatToDoNextAction: {
        label: "Open ROI summary",
        href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
      },
    },
  },
];
