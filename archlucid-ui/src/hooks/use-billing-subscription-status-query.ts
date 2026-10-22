"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchBillingSubscriptionStatus,
  type BillingSubscriptionStatus,
} from "@/lib/billing-subscription-status-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useBillingSubscriptionStatusQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<BillingSubscriptionStatus | null>({
    queryKey: operatorQueryKeys.billingSubscriptionStatus,
    queryFn: fetchBillingSubscriptionStatus,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
