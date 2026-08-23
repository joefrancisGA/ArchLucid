"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { isRunNeedingAttention } from "@/components/operator-home/runs-dashboard-helpers";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import type { OperatorHomeLiveRunsSnapshot } from "@/lib/operator/operator-home-live-runs-dashboard";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

type OperatorHomeWorkspaceActivityContextValue = {
  readonly hasWorkspaceReviews: boolean;
  readonly hasOverviewReviewRows: boolean;
  readonly hasActionNeededReviews: boolean;
  readonly openFindingsCount: number;
  readonly recentRunIds: readonly string[];
  /** Null until the runs panel reports — consumers fall back to their server-rendered snapshot. */
  readonly liveRunsSnapshot: OperatorHomeLiveRunsSnapshot | null;
  /** Run ids already shown on unfinished-work rail awaiting-disposition rows (TB-2369). */
  readonly homeAttentionPreviewExcludedRunIds: readonly string[];
  readonly reportWorkspaceReviews: (items: readonly RunSummary[], totalCount?: number) => void;
  readonly reportHomeAttentionPreviewExcludedRunIds: (runIds: readonly string[]) => void;
};

const defaultValue: OperatorHomeWorkspaceActivityContextValue = {
  hasWorkspaceReviews: false,
  hasOverviewReviewRows: false,
  hasActionNeededReviews: false,
  openFindingsCount: 0,
  recentRunIds: [],
  liveRunsSnapshot: null,
  homeAttentionPreviewExcludedRunIds: [],
  reportWorkspaceReviews: () => {},
  reportHomeAttentionPreviewExcludedRunIds: () => {},
};

const OperatorHomeWorkspaceActivityContext =
  createContext<OperatorHomeWorkspaceActivityContextValue>(defaultValue);

type OperatorHomeWorkspaceActivityProviderProps = {
  readonly initialHasReviews: boolean;
  readonly initialHasOverviewReviewRows?: boolean;
  readonly initialOpenFindingsCount?: number;
  readonly initialRecentRunIds?: readonly string[];
  readonly children: ReactNode;
};

/** Shares live workspace review counts for state-aware homepage emphasis. */
export function OperatorHomeWorkspaceActivityProvider(
  props: OperatorHomeWorkspaceActivityProviderProps,
): React.JSX.Element {
  const [hasWorkspaceReviews, setHasWorkspaceReviews] = useState(props.initialHasReviews);
  const [hasOverviewReviewRows, setHasOverviewReviewRows] = useState(
    props.initialHasOverviewReviewRows ?? props.initialHasReviews,
  );
  const [hasActionNeededReviews, setHasActionNeededReviews] = useState(false);
  const [openFindingsCount, setOpenFindingsCount] = useState(props.initialOpenFindingsCount ?? 0);
  const [recentRunIds, setRecentRunIds] = useState<readonly string[]>(props.initialRecentRunIds ?? []);
  const [liveRunsSnapshot, setLiveRunsSnapshot] = useState<OperatorHomeLiveRunsSnapshot | null>(null);
  const [homeAttentionPreviewExcludedRunIds, setHomeAttentionPreviewExcludedRunIds] = useState<
    readonly string[]
  >([]);

  const reportHomeAttentionPreviewExcludedRunIds = useCallback((runIds: readonly string[]) => {
    setHomeAttentionPreviewExcludedRunIds((current) =>
      current.length === runIds.length && current.every((runId, index) => runId === runIds[index])
        ? current
        : runIds,
    );
  }, []);

  const reportWorkspaceReviews = useCallback((items: readonly RunSummary[], totalCount?: number) => {
    const activeItems = items.filter((run) => run.isArchived !== true);
    // Synthetic demo/seeded Overview rows stay visible in Recent reviews but must not flip
    // empty-home off — otherwise Do-this-next / Open sample package disappears (TB-1039).
    const realItems = activeItems.filter((run) => !isDemoSeededOverviewInjectedRun(run));
    const metrics = deriveOperatorHomeWorkspaceMetrics(realItems, realItems.length);

    setHasWorkspaceReviews(realItems.length > 0);
    setHasOverviewReviewRows(activeItems.length > 0);
    setHasActionNeededReviews(realItems.some(isRunNeedingAttention));
    setOpenFindingsCount(metrics.openFindings);
    setRecentRunIds(activeItems.map((run) => run.runId));

    const nextTotalCount = typeof totalCount === "number" ? totalCount : items.length;

    // Reuse the previous snapshot object when nothing moved, so a repeated report does not
    // re-render every runs-derived consumer with an equivalent value.
    setLiveRunsSnapshot((current) =>
      current !== null && current.items === items && current.totalCount === nextTotalCount
        ? current
        : { items, totalCount: nextTotalCount },
    );
  }, []);

  const value = useMemo(
    (): OperatorHomeWorkspaceActivityContextValue => ({
      hasWorkspaceReviews,
      hasOverviewReviewRows,
      hasActionNeededReviews,
      openFindingsCount,
      recentRunIds,
      liveRunsSnapshot,
      homeAttentionPreviewExcludedRunIds,
      reportWorkspaceReviews,
      reportHomeAttentionPreviewExcludedRunIds,
    }),
    [
      hasActionNeededReviews,
      hasOverviewReviewRows,
      hasWorkspaceReviews,
      homeAttentionPreviewExcludedRunIds,
      liveRunsSnapshot,
      openFindingsCount,
      recentRunIds,
      reportHomeAttentionPreviewExcludedRunIds,
      reportWorkspaceReviews,
    ],
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
