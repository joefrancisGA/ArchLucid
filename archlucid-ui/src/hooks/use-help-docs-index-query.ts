"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHelpDocsIndex } from "@/lib/help-docs-index";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useHelpDocsIndexQuery() {
  return useQuery({
    queryKey: operatorQueryKeys.helpDocsIndex,
    queryFn: fetchHelpDocsIndex,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
