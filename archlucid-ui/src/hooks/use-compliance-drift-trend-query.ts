"use client";

import { useQuery } from "@tanstack/react-query";

import { getComplianceDriftTrend } from "@/lib/api";
import { isBrowser } from "@/lib/api/http";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
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

export function useComplianceDriftTrendQuery() {
  return useQuery<ComplianceDriftTrendPoint[]>({
    queryKey: operatorQueryKeys.complianceDriftTrend30d,
    queryFn: fetchComplianceDriftTrend30Days,
    enabled: isBrowser(),
  });
}
