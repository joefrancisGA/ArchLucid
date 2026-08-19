"use client";

import { useQuery } from "@tanstack/react-query";

import { getComplianceDriftTrend } from "@/lib/api";
import { isBrowser } from "@/lib/api/http";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

function rollingBounds30Days(): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - 30);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

async function fetchComplianceDriftTrend30Days(): Promise<ComplianceDriftTrendPoint[]> {
  const bounds = rollingBounds30Days();

  return getComplianceDriftTrend(bounds.fromUtc, bounds.toUtc, 1440);
}

type UseComplianceDriftTrendQueryOptions = {
  readonly enabled?: boolean;
  readonly refetchIntervalMs?: number;
};

export function useComplianceDriftTrendQuery(options?: UseComplianceDriftTrendQueryOptions) {
  return useQuery<ComplianceDriftTrendPoint[]>({
    queryKey: operatorQueryKeys.complianceDriftTrend30d,
    queryFn: fetchComplianceDriftTrend30Days,
    enabled: options?.enabled ?? isBrowser(),
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
