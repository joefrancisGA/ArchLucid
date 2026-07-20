import { FileCheck2, FileText, LayoutGrid, Newspaper, TrendingUp } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  SPONSOR_REPORT_SECTION_LABEL,
} from "@/lib/sponsor-report-navigation";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · reports — sponsor-facing value summaries and digest subscriptions. */
export class OperateReportsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-reports",
      label: OPERATOR_NAV_GROUP_LABELS.reports,
      surface: "review-workflow",
      caption: "Sponsor-facing value reports and digest subscriptions.",
      links: [
        {
          href: "/sponsor-report/executive-summary",
          label: "Executive summary",
          title: `${SPONSOR_REPORT_SECTION_LABEL} — executive summary and exports`,
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
        {
          href: "/sponsor-report/architecture-scorecard",
          label: BUYER_TERMINOLOGY.reviewScorecard,
          title: `${BUYER_TERMINOLOGY.reviewScorecard} — value metrics and recommended actions`,
          icon: LayoutGrid,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/digests",
          label: OPERATOR_NAV_LINK_LABELS.digests,
          title: "Digests — generated digests, subscriptions, and sponsor schedule",
          icon: Newspaper,
          tier: "advanced",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
