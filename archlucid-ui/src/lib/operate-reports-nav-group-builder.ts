import { FileCheck2, FileText, TrendingUp } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  EXECUTIVE_SUMMARY_PAGE_TITLE,
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/**
 * Operate · reports — sponsor-facing value summaries.
 * Architecture scorecard lives under Insights (`/insights/architecture-scorecard`); do not list it here.
 */
export class OperateReportsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-reports",
      label: OPERATOR_NAV_GROUP_LABELS.reports,
      surface: "review-workflow",
      caption: "Sponsor-facing value reports.",
      links: [
        {
          href: "/sponsor-report/executive-summary",
          label: EXECUTIVE_SUMMARY_PAGE_TITLE,
          title: `${SPONSOR_REPORT_SECTION_LABEL} — executive value report and exports`,
          icon: FileText,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/sponsor-report/pilot-outcomes",
          label: OPERATOR_NAV_LINK_LABELS.pilotValueReport,
          title: "Pilot outcomes — finalized-review metrics and governance signals",
          icon: FileCheck2,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/sponsor-report/roi-summary",
          label: OPERATOR_NAV_LINK_LABELS.roiReport,
          title: "ROI summary — hours estimate from severities and governance blocks",
          icon: TrendingUp,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
