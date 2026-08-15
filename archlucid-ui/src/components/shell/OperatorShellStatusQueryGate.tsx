"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorShellStatusQueriesEnabled } from "@/hooks/use-operator-shell-status-queries-enabled";
import {
  fetchAndHydrateOperatorShellStatus,
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
    queryFn: async () => {
      const payload = await fetchAndHydrateOperatorShellStatus(queryClient, scope);
      writeOperatorShellStableCache({
        trialStatus: payload.trialStatus,
        catalogMigration: payload.catalogMigration ?? undefined,
        llmMonthlyBudgetStatus: payload.llmMonthlyBudgetStatus ?? undefined,
        alertsInboxSummary: payload.alertsInboxSummary ?? undefined,
      });
      return payload;
    },
    enabled: shellQueriesEnabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  useEffect(() => {
    if (bootstrap.data === undefined) {
      return;
    }

    // Persist restore and Strict Mode remounts can skip queryFn; keep caches aligned.
    hydrateOperatorShellStatusCaches(queryClient, scope, bootstrap.data);
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
