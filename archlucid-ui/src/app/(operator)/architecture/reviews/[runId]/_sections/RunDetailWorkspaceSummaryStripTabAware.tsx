"use client";

import { useSearchParams } from "next/navigation";

import {
  REVIEW_DETAIL_TAB_PARAM,
  resolveReviewDetailTab,
} from "@/lib/review-detail-workspace-tabs";

import {
  RunDetailWorkspaceSummaryStrip,
  type RunDetailWorkspaceSummaryStripProps,
} from "./RunDetailWorkspaceChrome";

/** Hides duplicate findings navigation when the Findings tab is already active. */
export function RunDetailWorkspaceSummaryStripTabAware(
  props: RunDetailWorkspaceSummaryStripProps,
): React.JSX.Element {
  const searchParams = useSearchParams();
  const activeTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));

  return (
    <RunDetailWorkspaceSummaryStrip
      {...props}
      suppressFindingsDeepLink={activeTab === "findings"}
    />
  );
}
