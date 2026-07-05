import { BarChart3, FileCheck2, FileText, Newspaper, TrendingUp } from "lucide-react";

import type { NavGroupConfig } from "@/lib/nav-config.types";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { NavGroupBuilderBase } from "@/lib/nav-group-builder-base";

/** Operate · reports — scorecards and sponsor-facing value summaries. */
export class OperateReportsNavGroupBuilder extends NavGroupBuilderBase {
  build(): NavGroupConfig {
    return {
      id: "operate-reports",
      label: OPERATOR_NAV_GROUP_LABELS.reports,
      surface: "review-workflow",
      caption: "Review scorecards and sponsor-facing value reports.",
      links: [
        {
          href: "/scorecard",
          label: OPERATOR_NAV_LINK_LABELS.scorecard,
          title: `${BUYER_TERMINOLOGY.reviewScorecard} — finalized-review metrics and ROI baselines`,
          icon: BarChart3,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/value-report",
          label: OPERATOR_NAV_LINK_LABELS.valueReport,
          title: "Value report — sponsor DOCX from ROI_MODEL-aligned tenant metrics",
          icon: FileText,
          tier: "advanced",
          requiredAuthority: "ExecuteAuthority",
        },
        {
          href: "/value-report/pilot",
          label: OPERATOR_NAV_LINK_LABELS.pilotValueReport,
          title: `${BUYER_TERMINOLOGY.evaluationValueReport} — finalized-review metrics and governance signals`,
          icon: FileCheck2,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
        {
          href: "/value-report/roi",
          label: OPERATOR_NAV_LINK_LABELS.roiReport,
          title: "ROI report — hours estimate from severities and pre-finalize audit blocks",
          icon: TrendingUp,
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
