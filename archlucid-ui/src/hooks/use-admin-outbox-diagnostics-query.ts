"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAdminOutboxDiagnostics, type AdminOutboxSnapshot } from "@/lib/fetch-admin-outbox-diagnostics";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useAdminOutboxDiagnosticsQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<AdminOutboxSnapshot | null>({
    queryKey: operatorQueryKeys.adminOutboxDiagnostics,
    queryFn: fetchAdminOutboxDiagnostics,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
