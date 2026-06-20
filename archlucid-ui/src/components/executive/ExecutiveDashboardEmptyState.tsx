"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF } from "@/app/(operator)/dashboard/_sections/ExecutiveDashboardBaselineWarningBanner";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

/** Global empty state when the executive dashboard has no committed reviews. */
export function ExecutiveDashboardEmptyState(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <EnterpriseCompactEmptyState
      testId="executive-dashboard-empty-state"
      title={v.emptyStateTitle}
      description={v.emptyStateDescription}
      actions={[
        { label: v.emptyStatePrimaryAction, href: "/reviews/new", variant: "primary" },
        {
          label: v.emptyStateSecondaryAction,
          href: EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF,
          variant: "outline",
        },
      ]}
      footer={<SeedSampleReviewButton label="Load sample workspace" />}
    />
  );
}
