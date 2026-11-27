"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPricingCatalog } from "@/lib/pricing-catalog-client";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useMarketingPublicPricingQuery(options?: { readonly enabled?: boolean }) {
  // Public pricing is mounted outside the operator layout and has no query provider.
  return useQuery({
    queryKey: operatorQueryKeys.marketingPublicPricing,
    queryFn: fetchPricingCatalog,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  }, getOperatorQueryClient());
}
