"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { isRunNeedingAttention } from "@/components/operator-home/runs-dashboard-helpers";
import type { RunSummary } from "@/types/authority";

type OperatorHomeWorkspaceActivityContextValue = {
  readonly hasWorkspaceReviews: boolean;
  readonly hasActionNeededReviews: boolean;
  readonly recentRunIds: readonly string[];
  readonly reportWorkspaceReviews: (items: readonly RunSummary[]) => void;
};

const defaultValue: OperatorHomeWorkspaceActivityContextValue = {
  hasWorkspaceReviews: false,
  hasActionNeededReviews: false,
  recentRunIds: [],
  reportWorkspaceReviews: () => {},
};

function normalizeRecentRunIds(runIds: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of runIds ?? []) {
    const trimmed = raw.trim();

    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function resolveRecentRunIdsFromSummaries(items: readonly RunSummary[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const run of items) {
    if (run.isArchived === true) {
      continue;
    }

    const runId = run.runId?.trim() ?? "";

    if (runId.length === 0 || seen.has(runId)) {
      continue;
    }

    seen.add(runId);
    result.push(runId);
  }

  return result;
}

const OperatorHomeWorkspaceActivityContext =
  createContext<OperatorHomeWorkspaceActivityContextValue>(defaultValue);

type OperatorHomeWorkspaceActivityProviderProps = {
  readonly initialHasReviews: boolean;
  /** Server-rendered recent run ids for dev quick-jump first paint. */
  readonly initialRecentRunIds?: readonly string[];
  readonly children: ReactNode;
};

/** Shares live workspace review counts for state-aware homepage emphasis. */
export function OperatorHomeWorkspaceActivityProvider(
  props: OperatorHomeWorkspaceActivityProviderProps,
): React.JSX.Element {
  const [hasWorkspaceReviews, setHasWorkspaceReviews] = useState(props.initialHasReviews);
  const [hasActionNeededReviews, setHasActionNeededReviews] = useState(false);
  const [recentRunIds, setRecentRunIds] = useState<string[]>(() =>
    normalizeRecentRunIds(props.initialRecentRunIds),
  );

  const reportWorkspaceReviews = useCallback((items: readonly RunSummary[]) => {
    const activeItems = items.filter((run) => run.isArchived !== true);

    setHasWorkspaceReviews(activeItems.length > 0);
    setHasActionNeededReviews(activeItems.some(isRunNeedingAttention));
    setRecentRunIds(resolveRecentRunIdsFromSummaries(items));
  }, []);

  const value = useMemo(
    (): OperatorHomeWorkspaceActivityContextValue => ({
      hasWorkspaceReviews,
      hasActionNeededReviews,
      recentRunIds,
      reportWorkspaceReviews,
    }),
    [hasActionNeededReviews, hasWorkspaceReviews, recentRunIds, reportWorkspaceReviews],
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
