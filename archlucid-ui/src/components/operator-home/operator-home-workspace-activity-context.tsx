"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { isRunNeedingAttention } from "@/components/operator-home/runs-dashboard-helpers";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

type OperatorHomeWorkspaceActivityContextValue = {
  readonly hasWorkspaceReviews: boolean;
  readonly hasActionNeededReviews: boolean;
  readonly openFindingsCount: number;
  readonly recentRunIds: readonly string[];
  readonly reportWorkspaceReviews: (items: readonly RunSummary[]) => void;
};

const defaultValue: OperatorHomeWorkspaceActivityContextValue = {
  hasWorkspaceReviews: false,
  hasActionNeededReviews: false,
  openFindingsCount: 0,
  recentRunIds: [],
  reportWorkspaceReviews: () => {},
};

const OperatorHomeWorkspaceActivityContext =
  createContext<OperatorHomeWorkspaceActivityContextValue>(defaultValue);

type OperatorHomeWorkspaceActivityProviderProps = {
  readonly initialHasReviews: boolean;
  readonly initialOpenFindingsCount?: number;
  readonly initialRecentRunIds?: readonly string[];
  readonly children: ReactNode;
};

/** Shares live workspace review counts for state-aware homepage emphasis. */
export function OperatorHomeWorkspaceActivityProvider(
  props: OperatorHomeWorkspaceActivityProviderProps,
): React.JSX.Element {
  const [hasWorkspaceReviews, setHasWorkspaceReviews] = useState(props.initialHasReviews);
  const [hasActionNeededReviews, setHasActionNeededReviews] = useState(false);
  const [openFindingsCount, setOpenFindingsCount] = useState(props.initialOpenFindingsCount ?? 0);
  const [recentRunIds, setRecentRunIds] = useState<readonly string[]>(props.initialRecentRunIds ?? []);

  const reportWorkspaceReviews = useCallback((items: readonly RunSummary[]) => {
    const activeItems = items.filter((run) => run.isArchived !== true);
    const metrics = deriveOperatorHomeWorkspaceMetrics(activeItems, activeItems.length);

    setHasWorkspaceReviews(activeItems.length > 0);
    setHasActionNeededReviews(activeItems.some(isRunNeedingAttention));
    setOpenFindingsCount(metrics.openFindings);
    setRecentRunIds(activeItems.map((run) => run.runId));
  }, []);

  const value = useMemo(
    (): OperatorHomeWorkspaceActivityContextValue => ({
      hasWorkspaceReviews,
      hasActionNeededReviews,
      openFindingsCount,
      recentRunIds,
      reportWorkspaceReviews,
    }),
    [hasActionNeededReviews, hasWorkspaceReviews, openFindingsCount, recentRunIds, reportWorkspaceReviews],
  );

  return (
    <OperatorHomeWorkspaceActivityContext.Provider value={value}>
      {props.children}
    </OperatorHomeWorkspaceActivityContext.Provider>
  );
}

export function useOperatorHomeWorkspaceActivity(): OperatorHomeWorkspaceActivityContextValue {
  return useContext(OperatorHomeWorkspaceActivityContext);
}
