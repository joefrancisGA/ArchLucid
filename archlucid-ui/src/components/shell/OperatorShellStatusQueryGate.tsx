"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";

import { LlmMonthlyBudgetStatusPollOwner } from "@/components/shell/LlmMonthlyBudgetStatusPollOwner";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorShellStatusQueriesEnabled } from "@/hooks/use-operator-shell-status-queries-enabled";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import {
  fetchAndHydrateOperatorShellStatus,
  hydrateOperatorShellStatusCaches,
  type OperatorShellStatusPayload,
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

function synchronouslyHydrateOperatorShellStatusCaches(
  queryClient: QueryClient,
  scope: OperatorScopeQueryKey,
  payload: OperatorShellStatusPayload | undefined,
  hydratedPayloadRef: { current: OperatorShellStatusPayload | undefined },
): void {
  if (payload === undefined || hydratedPayloadRef.current === payload) {
    return;
  }

  hydrateOperatorShellStatusCaches(queryClient, scope, payload);
  hydratedPayloadRef.current = payload;
}

/** Boots aggregated shell status, hydrates per-concern caches, and gates banner fan-out. */
export function OperatorShellStatusQueryGate(props: OperatorShellStatusQueryGateProps) {
  const shellQueriesEnabled = useOperatorShellStatusQueriesEnabled();
  const scope = useOperatorScopeQueryKey();
  const queryClient = useQueryClient();
  const hydratedBootstrapPayloadRef = useRef<OperatorShellStatusPayload | undefined>(undefined);
  const stableCacheHydratedScopeRef = useRef<string | null>(null);
  const scopeSnapshot = `${scope.tenantId}:${scope.workspaceId}:${scope.projectId}`;

  useLayoutEffect(() => {
    if (stableCacheHydratedScopeRef.current === scopeSnapshot) {
      return;
    }

    hydrateOperatorShellStableCache(queryClient, scope);
    stableCacheHydratedScopeRef.current = scopeSnapshot;
  }, [queryClient, scope, scopeSnapshot]);

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

  // Persist restore and Strict Mode remounts can skip queryFn; hydrate before concern observers fetch.
  synchronouslyHydrateOperatorShellStatusCaches(
    queryClient,
    scope,
    bootstrap.data,
    hydratedBootstrapPayloadRef,
  );

  const value = useMemo<OperatorShellStatusQueryGateValue>(
    () => ({
      shellQueriesEnabled,
      concernFetchEnabled: shellQueriesEnabled && (bootstrap.isFetched || bootstrap.isError),
    }),
    [bootstrap.isError, bootstrap.isFetched, shellQueriesEnabled],
  );

  return (
    <OperatorShellStatusQueryGateContext.Provider value={value}>
      <LlmMonthlyBudgetStatusPollOwner />
      {props.children}
    </OperatorShellStatusQueryGateContext.Provider>
  );
}

export function useOperatorShellStatusConcernFetchEnabled(): boolean {
  return useContext(OperatorShellStatusQueryGateContext).concernFetchEnabled;
}
