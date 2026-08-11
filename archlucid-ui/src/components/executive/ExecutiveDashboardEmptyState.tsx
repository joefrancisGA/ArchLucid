"use client";

import Link from "next/link";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Compact empty state when portfolio metrics are not yet populated — header owns Start. */
export function ExecutiveDashboardEmptyState(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div className="space-y-4" data-testid="executive-dashboard-empty-state-region">
      <EnterpriseCompactEmptyState
        title={v.emptyStateTitle}
        description={v.emptyStateDescription}
        testId="executive-dashboard-empty-state"
        footer={
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-fit max-w-full flex-col gap-1">
              <SeedSampleReviewButton
                label={v.emptyStateSecondaryAction}
                size="sm"
                className="w-fit self-start"
              />
              <p className={`m-0 text-al-text-secondary ${OPERATOR_TYPOGRAPHY.micro}`}>{v.emptyStateSecondaryHelper}</p>
            </div>
            <p className="m-0">
              <Link
                href="/architecture/reviews"
                className={OPERATOR_LINK.inline}
                data-testid="executive-dashboard-empty-open-reviews"
              >
                {v.emptyStateTertiaryAction}
              </Link>
            </p>
          </div>
        }
      />
    </div>
  );
}
