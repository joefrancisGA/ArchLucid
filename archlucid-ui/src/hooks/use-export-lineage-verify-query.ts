"use client";

import { verifyRunExportLineage } from "@/lib/api/export-lineage-verify-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { exportLineageVerifyBlockedReason } from "@/lib/exports/export-lineage-verify-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseExportLineageVerifyQueryOptions = {
  readonly runId: string;
  readonly enabled?: boolean;
};

export function useExportLineageVerifyQuery(options: UseExportLineageVerifyQueryOptions) {
  const runId = options.runId.trim();
  const enabled = (options.enabled ?? true) && runId.length > 0;

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.exportLineageVerify(runId),
    queryFn: () => verifyRunExportLineage(runId),
    enabled,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = exportLineageVerifyBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
