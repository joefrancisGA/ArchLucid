"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const securityEvidencePathReportQueryKeys = {
  report: (scopeKey: OperatorScopeQueryKey, snapshotId: string) =>
    ["security-evidence-path", "report", scopeKey, snapshotId] as const,
};

export function useSecurityEvidencePathReportQuery(snapshotId: string | null) {
  const scopeKey = useOperatorScopeQueryKey();
  const enabled = snapshotId !== null && snapshotId.trim().length > 0;

  return useQuery({
    queryKey: securityEvidencePathReportQueryKeys.report(scopeKey, snapshotId ?? ""),
    queryFn: () => fetchSecurityEvidencePathAttackPathReport(snapshotId ?? ""),
    enabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
