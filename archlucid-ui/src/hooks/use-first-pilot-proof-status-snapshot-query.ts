"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchFirstPilotProofStatusSnapshot,
  type FirstPilotProofStatusSnapshot,
} from "@/lib/first-pilot-proof-status-snapshot";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useFirstPilotProofStatusSnapshotQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<FirstPilotProofStatusSnapshot | null>({
    queryKey: operatorQueryKeys.firstPilotProofStatusSnapshot,
    queryFn: fetchFirstPilotProofStatusSnapshot,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
