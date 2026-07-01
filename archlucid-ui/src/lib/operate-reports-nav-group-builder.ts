import { BarChart3, FileText } from "lucide-react";

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
      ],
    };
  }
}
