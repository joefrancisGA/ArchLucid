"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { ExecutiveScorecardEmptyStatePreview } from "@/components/executive/ExecutiveScorecardEmptyStatePreview";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

/** Global empty state when the executive scorecard has no committed reviews. */
export function ExecutiveScorecardEmptyState(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div className="space-y-4" data-testid="executive-scorecard-empty-state">
      <EnterpriseCompactEmptyState
        title={v.emptyStateTitle}
        description={v.scorecardEmptyStateDescription}
        actions={[
          { label: v.scorecardEmptyStatePrimaryAction, href: "/architecture/reviews/new", variant: "primary" },
          {
            label: v.scorecardEmptyStateTertiaryAction,
            href: EXECUTIVE_DASHBOARD_HREF,
            variant: "outline",
          },
        ]}
        footer={<SeedSampleReviewButton label={v.scorecardEmptyStateSecondaryAction} />}
      />
      <ExecutiveScorecardEmptyStatePreview />
    </div>
  );
}
