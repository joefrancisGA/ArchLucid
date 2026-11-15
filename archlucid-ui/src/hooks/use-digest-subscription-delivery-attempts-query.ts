"use client";

import { useQueries, type QueryStatus } from "@tanstack/react-query";
import { useMemo } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { listSubscriptionDeliveryAttempts } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

export const DIGEST_SUBSCRIPTION_ATTEMPTS_TAKE = 30;

export function useDigestSubscriptionDeliveryAttemptsQueries(
  subscriptionIds: readonly string[],
  refreshToken: number,
) {
  const scope = useOperatorScopeQueryKey();

  const queries = useQueries({
    queries: subscriptionIds.map((subscriptionId) => ({
      queryKey: operatorQueryKeys.digestSubscriptionDeliveryAttempts(
        scope,
        subscriptionId,
        refreshToken,
      ),
      queryFn: () => listSubscriptionDeliveryAttempts(
        subscriptionId,
        DIGEST_SUBSCRIPTION_ATTEMPTS_TAKE,
      ),
      staleTime: OPERATOR_QUERY_STALE_MS,
      gcTime: OPERATOR_QUERY_GC_MS,
      retry: false,
    })),
  });

  return useMemo(() => {
    const attemptsBySub: Record<string, DigestDeliveryAttempt[]> = {};
    const attemptStatusBySub: Record<string, QueryStatus> = {};

    for (let index = 0; index < subscriptionIds.length; index++) {
      const subscriptionId = subscriptionIds[index];

      if (subscriptionId === undefined) {
        continue;
      }

      attemptsBySub[subscriptionId] = queries[index]?.data ?? [];
      attemptStatusBySub[subscriptionId] = queries[index]?.status ?? "pending";
    }

    return { attemptsBySub, attemptStatusBySub };
  }, [queries, subscriptionIds]);
}
