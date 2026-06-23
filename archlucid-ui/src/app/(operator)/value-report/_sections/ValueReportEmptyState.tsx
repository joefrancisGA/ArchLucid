"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import {
  BUYER_SEED_SAMPLE_WORKSPACE_CTA,
  BUYER_VALUE_REPORT_EMPTY_DESCRIPTION,
  BUYER_VALUE_REPORT_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";

/** Empty state when the selected report period has no finalized reviews. */
export function ValueReportEmptyState(): React.JSX.Element {
  return (
    <EnterpriseCompactEmptyState
      testId="value-report-empty-state"
      title={BUYER_VALUE_REPORT_EMPTY_TITLE}
      description={BUYER_VALUE_REPORT_EMPTY_DESCRIPTION}
      actions={[
        { label: "Start review", href: "/reviews/new", variant: "primary" },
        { label: "Open review packages", href: "/reviews?projectId=default", variant: "outline" },
      ]}
      footer={<SeedSampleReviewButton label={BUYER_SEED_SAMPLE_WORKSPACE_CTA} />}
    />
  );
}
