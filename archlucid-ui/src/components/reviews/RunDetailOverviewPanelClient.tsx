"use client";

import { RunDetailOverviewTab, type RunDetailOverviewTabProps } from "@/components/reviews/RunDetailOverviewTab";
import { useReviewDetailTabNavigation } from "@/components/reviews/ReviewDetailWorkspace";

export function RunDetailOverviewPanelClient(
  props: Omit<RunDetailOverviewTabProps, "onNavigateTab">,
): React.JSX.Element {
  const navigateTab = useReviewDetailTabNavigation();

  return <RunDetailOverviewTab {...props} onNavigateTab={navigateTab} />;
}
