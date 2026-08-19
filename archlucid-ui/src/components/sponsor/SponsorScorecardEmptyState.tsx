import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { SponsorScorecardEmptyStatePreview } from "@/components/sponsor/SponsorScorecardEmptyStatePreview";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

/** Global empty state when the sponsor scorecard has no committed reviews. */
export function SponsorScorecardEmptyState(): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  return (
    <div className="space-y-4" data-testid="sponsor-scorecard-empty-state">
      <EnterpriseCompactEmptyState
        title={v.emptyStateTitle}
        description={v.scorecardEmptyStateDescription}
        actions={[
          { label: v.scorecardEmptyStatePrimaryAction, href: "/architecture/reviews/new", variant: "primary" },
          {
            label: v.scorecardEmptyStateTertiaryAction,
            href: SPONSOR_DASHBOARD_HREF,
            variant: "outline",
          },
        ]}
        footer={<SeedSampleReviewButton label={v.scorecardEmptyStateSecondaryAction} />}
      />
      <CollapsibleSection
        title={v.scorecardEmptyStatePreviewSectionTitle}
        summaryLine="Preview the KPI story before your first committed review."
        sectionTestId="sponsor-scorecard-empty-preview-disclosure"
      >
        <SponsorScorecardEmptyStatePreview embedded />
      </CollapsibleSection>
    </div>
  );
}
