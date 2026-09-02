"use client";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useRunsDashboardLoadPhase } from "@/components/operator-home/use-runs-dashboard-load-phase";
import { useRunsDashboardTabs } from "@/components/operator-home/use-runs-dashboard-tabs";

export type UseRunsDashboardPanelOptions = {
  readonly hideHeading?: boolean;
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function useRunsDashboardPanel({
  hideHeading = false,
  initialModel = null,
}: UseRunsDashboardPanelOptions = {}) {
  const loadPhase = useRunsDashboardLoadPhase({ initialModel });
  const tabs = useRunsDashboardTabs({
    hideHeading,
    buyerPolishedShell: loadPhase.buyerPolishedShell,
    projectId: loadPhase.projectId,
    phase: loadPhase.phase,
    failure: loadPhase.failure,
    effectiveItems: loadPhase.effectiveItems,
    loadedTotalCount: loadPhase.loadedTotalCount,
    restoreArchivedRequest: loadPhase.restoreArchivedRequest,
  });

  return {
    hideHeading,
    buyerPolishedShell: loadPhase.buyerPolishedShell,
    phase: loadPhase.phase,
    failure: loadPhase.failure,
    effectiveItems: loadPhase.effectiveItems,
    restoreBusyRequestId: loadPhase.restoreBusyRequestId,
    ...tabs,
  };
}

export type RunsDashboardPanelViewModel = ReturnType<typeof useRunsDashboardPanel>;
