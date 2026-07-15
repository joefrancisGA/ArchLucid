"use client";

import { RunDetailOverviewTab, type RunDetailOverviewTabProps } from "@/components/reviews/RunDetailOverviewTab";

export function RunDetailOverviewPanelClient(
  props: RunDetailOverviewTabProps,
): React.JSX.Element {
  return <RunDetailOverviewTab {...props} />;
}
