import { BarChart3, FileText, ShieldCheck } from "lucide-react";

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
      caption: "Review scorecards, value reports, and early governance adoption.",
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
          href: "/governance/first-30-days",
          label: OPERATOR_NAV_LINK_LABELS.first30DaysGovernance,
          title: "First 30 days — minimal governance operating preset after evaluation",
          icon: ShieldCheck,
          tier: "extended",
          requiredAuthority: "ReadAuthority",
        },
      ],
    };
  }
}
