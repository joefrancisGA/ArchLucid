"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { SponsorScorecardEmptyStatePreview } from "@/components/sponsor/SponsorScorecardEmptyStatePreview";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  SPONSOR_SCORECARD_EMPTY_PREVIEW_OPEN_PARAM,
  parseSponsorScorecardEmptyPreviewOpenFromSearch,
  sponsorScorecardEmptyPreviewDisclosureHrefFromSearch,
} from "@/lib/sponsor/sponsor-scorecard-empty-preview-disclosure-url";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

/** Global empty state when the sponsor scorecard has no committed reviews. */
export function SponsorScorecardEmptyState(): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const previewOpenParam = searchParams.get(SPONSOR_SCORECARD_EMPTY_PREVIEW_OPEN_PARAM);
  const [previewOpen, setPreviewOpenState] = useState(() =>
    parseSponsorScorecardEmptyPreviewOpenFromSearch(previewOpenParam),
  );

  const syncPreviewOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(sponsorScorecardEmptyPreviewDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setPreviewOpen = useCallback(
    (open: boolean) => {
      setPreviewOpenState(open);
      syncPreviewOpenToUrl(open);
    },
    [syncPreviewOpenToUrl],
  );

  useEffect(() => {
    setPreviewOpenState(parseSponsorScorecardEmptyPreviewOpenFromSearch(previewOpenParam));
  }, [previewOpenParam]);

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
        open={previewOpen}
        onToggle={setPreviewOpen}
      >
        <SponsorScorecardEmptyStatePreview embedded />
      </CollapsibleSection>
    </div>
  );
}
