"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAdminConfigLintSummary,
  type AdminConfigLintSummary,
} from "@/lib/fetch-admin-config-lint";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useAdminConfigLintSummaryQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<AdminConfigLintSummary>({
    queryKey: operatorQueryKeys.adminConfigLintSummary,
    queryFn: fetchAdminConfigLintSummary,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
