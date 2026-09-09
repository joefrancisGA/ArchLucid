"use client";

import { useMemo } from "react";

import { useResolvedReviewDetailActiveTab } from "@/hooks/use-resolved-review-detail-active-tab";
import { RunDetailSectionNav, type RunDetailSection } from "@/components/runs/RunDetailSectionNav";
import type { ResolveReviewDetailVisibleTabsInput } from "@/lib/resolve-review-detail-visible-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import { filterRunDetailInPageAnchorSectionsForTab } from "@/lib/runs/run-detail-section-tab-map";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

type RunDetailTabbedSectionNavProps = {
  readonly runId: string;
  readonly parentArchitectureId?: string | null;
  readonly sections: RunDetailSection[];
  readonly tabLifecycle?: ResolveReviewDetailVisibleTabsInput;
  readonly lifecycle?: ReviewWorkspaceLifecycle;
};

/**
 * In-page anchor nav scoped to the active review workspace tab so long tabs stay scannable
 * without listing anchors that live on other tabs.
 */
export function RunDetailTabbedSectionNav(props: RunDetailTabbedSectionNavProps): React.JSX.Element | null {
  const activeTab = useResolvedReviewDetailActiveTab({
    tabLifecycle: props.tabLifecycle,
    lifecycle: props.lifecycle,
  });

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
      activeReviewTab={activeTab}
    />
  );
}

export function runDetailTabbedSectionNavVisible(
  sections: readonly RunDetailSection[],
  tabId: ReviewDetailTabId,
): boolean {
  return filterRunDetailInPageAnchorSectionsForTab(sections, tabId).length >= 3;
}
