"use client";

import { useMemo } from "react";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { resolveLiveRunsDashboardModel } from "@/lib/operator/operator-home-live-runs-dashboard";

/**
 * Runs dashboard model for home surfaces: the refreshed client snapshot once the reviews panel has
 * reported, otherwise the server-rendered first paint. Safe outside the activity provider.
 */
export function useLiveOperatorHomeRunsDashboard(
  ssrModel: OperatorHomeRunsDashboardModel,
): OperatorHomeRunsDashboardModel {
  const { liveRunsSnapshot } = useOperatorHomeWorkspaceActivity();

  return useMemo(
    () => resolveLiveRunsDashboardModel(ssrModel, liveRunsSnapshot),
    [liveRunsSnapshot, ssrModel],
  );
}
