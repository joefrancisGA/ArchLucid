"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { ExecutiveDashboardEmptyStatePreview } from "@/components/executive/ExecutiveDashboardEmptyStatePreview";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

/** Global empty state when the portfolio dashboard has no committed reviews. */
export function ExecutiveDashboardEmptyState(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div className="space-y-4" data-testid="executive-dashboard-empty-state">
      <EnterpriseCompactEmptyState
        title={v.emptyStateTitle}
        description={v.emptyStateDescription}
        actions={[
          { label: v.emptyStatePrimaryAction, href: "/reviews/new", variant: "primary" },
          {
            label: v.emptyStateTertiaryAction,
            href: getShowcaseExecutiveHref(),
            variant: "outline",
          },
        ]}
        footer={<SeedSampleReviewButton label={v.emptyStateSecondaryAction} />}
      />
      <ExecutiveDashboardEmptyStatePreview />
    </div>
  );
}
