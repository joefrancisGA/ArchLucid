"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { RunDetailSectionNav, type RunDetailSection } from "@/components/runs/RunDetailSectionNav";
import { filterRunDetailInPageAnchorSectionsForTab } from "@/lib/runs/run-detail-section-tab-map";
import {
  REVIEW_DETAIL_TAB_PARAM,
  resolveReviewDetailTab,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

type RunDetailTabbedSectionNavProps = {
  readonly runId: string;
  readonly parentArchitectureId?: string | null;
  readonly sections: RunDetailSection[];
};

/**
 * In-page anchor nav scoped to the active review workspace tab so long tabs stay scannable
 * without listing anchors that live on other tabs.
 */
export function RunDetailTabbedSectionNav(props: RunDetailTabbedSectionNavProps): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const activeTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));

  const sectionsForTab = useMemo(
    () => filterRunDetailInPageAnchorSectionsForTab(props.sections, activeTab),
    [props.sections, activeTab],
  );

  return (
    <RunDetailSectionNav
      key={activeTab}
      runId={props.runId}
      parentArchitectureId={props.parentArchitectureId}
      sections={sectionsForTab}
    />
  );
}

export function runDetailTabbedSectionNavVisible(
  sections: readonly RunDetailSection[],
  tabId: ReviewDetailTabId,
): boolean {
  return filterRunDetailInPageAnchorSectionsForTab(sections, tabId).length >= 3;
}
