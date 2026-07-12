"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { isRunNeedingAttention } from "@/components/operator-home/runs-dashboard-helpers";
import type { RunSummary } from "@/types/authority";

type OperatorHomeWorkspaceActivityContextValue = {
  readonly hasWorkspaceReviews: boolean;
  readonly hasActionNeededReviews: boolean;
  readonly reportWorkspaceReviews: (items: readonly RunSummary[]) => void;
};

const defaultValue: OperatorHomeWorkspaceActivityContextValue = {
  hasWorkspaceReviews: false,
  hasActionNeededReviews: false,
  reportWorkspaceReviews: () => {},
};

const OperatorHomeWorkspaceActivityContext =
  createContext<OperatorHomeWorkspaceActivityContextValue>(defaultValue);

type OperatorHomeWorkspaceActivityProviderProps = {
  readonly initialHasReviews: boolean;
  readonly children: ReactNode;
};

/** Shares live workspace review counts for state-aware homepage emphasis. */
export function OperatorHomeWorkspaceActivityProvider(
  props: OperatorHomeWorkspaceActivityProviderProps,
): React.JSX.Element {
  const [hasWorkspaceReviews, setHasWorkspaceReviews] = useState(props.initialHasReviews);
  const [hasActionNeededReviews, setHasActionNeededReviews] = useState(false);

  const reportWorkspaceReviews = useCallback((items: readonly RunSummary[]) => {
    const activeItems = items.filter((run) => run.isArchived !== true);

    setHasWorkspaceReviews(activeItems.length > 0);
    setHasActionNeededReviews(activeItems.some(isRunNeedingAttention));
  }, []);

  const value = useMemo(
    (): OperatorHomeWorkspaceActivityContextValue => ({
      hasWorkspaceReviews,
      hasActionNeededReviews,
      reportWorkspaceReviews,
    }),
    [hasActionNeededReviews, hasWorkspaceReviews, reportWorkspaceReviews],
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
