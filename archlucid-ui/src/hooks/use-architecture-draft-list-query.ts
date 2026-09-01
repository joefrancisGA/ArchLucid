"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { listDraftRequests } from "@/lib/api/draft-intake-api";
import { mapDraftSummariesToRegistryEntries } from "@/lib/architecture/architecture-draft-summary-mapper";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { getOperatorScopeQueryKeySnapshot } from "@/lib/operator/operator-scope-query-key";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS, OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

export function useArchitectureDraftListQuery(options?: { readonly enabled?: boolean }) {
  const scopeKey = getOperatorScopeQueryKeySnapshot();

  return useQuery({
    queryKey: operatorQueryKeys.architectureDraftList(scopeKey),
    queryFn: async () => {
      const page = await listDraftRequests({ mine: true, page: 1, pageSize: 200 });

      return mapDraftSummariesToRegistryEntries(page.items);
    },
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}

/** Invalidates the server-backed draft inventory after create, patch, abandon, or submit. */
export function useInvalidateArchitectureDraftList(): () => void {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ["operator", "architecture", "draft-list"] });
  };
}

export function selectArchitectureDraftRegistryEntries(
  query: ReturnType<typeof useArchitectureDraftListQuery>,
): readonly ArchitectureDraftRegistryEntry[] {
  return query.data ?? [];
}
