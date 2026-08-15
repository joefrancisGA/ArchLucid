"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorShellStatusQueriesEnabled } from "@/hooks/use-operator-shell-status-queries-enabled";
import {
  fetchOperatorShellStatus,
  hydrateOperatorShellStatusCaches,
} from "@/lib/operator/operator-shell-status-client";
import {
  hydrateOperatorShellStableCache,
  writeOperatorShellStableCache,
} from "@/lib/operator/operator-shell-stable-cache";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type OperatorShellStatusQueryGateValue = {
  readonly shellQueriesEnabled: boolean;
  readonly concernFetchEnabled: boolean;
};

const OperatorShellStatusQueryGateContext = createContext<OperatorShellStatusQueryGateValue>({
  shellQueriesEnabled: false,
  concernFetchEnabled: false,
});

type OperatorShellStatusQueryGateProps = {
  readonly children: ReactNode;
};

/** Boots aggregated shell status, hydrates per-concern caches, and gates banner fan-out. */
export function OperatorShellStatusQueryGate(props: OperatorShellStatusQueryGateProps) {
  const shellQueriesEnabled = useOperatorShellStatusQueriesEnabled();
  const scope = useOperatorScopeQueryKey();
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrateOperatorShellStableCache(queryClient, scope);
  }, [queryClient, scope]);

  const bootstrap = useQuery({
    queryKey: operatorQueryKeys.operatorShellStatus(scope),
    queryFn: fetchOperatorShellStatus,
    enabled: shellQueriesEnabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  useEffect(() => {
    if (bootstrap.data === undefined) {
      return;
    }

    hydrateOperatorShellStatusCaches(queryClient, scope, bootstrap.data);
    writeOperatorShellStableCache({
      trialStatus: bootstrap.data.trialStatus,
      catalogMigration: bootstrap.data.catalogMigration ?? undefined,
      llmMonthlyBudgetStatus: bootstrap.data.llmMonthlyBudgetStatus ?? undefined,
      alertsInboxSummary: bootstrap.data.alertsInboxSummary ?? undefined,
    });
  }, [bootstrap.data, queryClient, scope]);

  const value = useMemo<OperatorShellStatusQueryGateValue>(
    () => ({
      shellQueriesEnabled,
      concernFetchEnabled: shellQueriesEnabled && (bootstrap.isFetched || bootstrap.isError),
    }),
    [bootstrap.isError, bootstrap.isFetched, shellQueriesEnabled],
  );

  return (
    <OperatorShellStatusQueryGateContext.Provider value={value}>
      {props.children}
    </OperatorShellStatusQueryGateContext.Provider>
  );
}

export function useOperatorShellStatusConcernFetchEnabled(): boolean {
  return useContext(OperatorShellStatusQueryGateContext).concernFetchEnabled;
}
