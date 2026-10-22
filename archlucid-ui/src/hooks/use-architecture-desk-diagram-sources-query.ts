"use client";

import { getRunDetail } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  readArchitectureDeskDiagramSourcesFromContextSnapshot,
  type ArchitectureDeskDiagramSourceRow,
} from "@/lib/architecture-spine/read-architecture-desk-diagram-sources";
import { tryStaticDemoRunDetail } from "@/lib/operator/operator-static-demo";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";

type UseArchitectureDeskDiagramSourcesQueryOptions = {
  readonly enabled?: boolean;
};

/** Loads diagram source rows from the latest review context snapshot (AS-044). */
export function useArchitectureDeskDiagramSourcesQuery(
  latestReviewId: string | null | undefined,
  options?: UseArchitectureDeskDiagramSourcesQueryOptions,
) {
  const trimmed = latestReviewId?.trim() ?? "";

  const query = createOperatorQueryHook<readonly ArchitectureDeskDiagramSourceRow[]>({
    queryKey: operatorQueryKeys.architectureDeskDiagramSources(trimmed),
    queryFn: async () => {
      if (shouldSkipLiveAuthorityRunScopedApi(trimmed)) {
        const staticDetail = tryStaticDemoRunDetail(trimmed);

        if (staticDetail !== null) {
          return readArchitectureDeskDiagramSourcesFromContextSnapshot(staticDetail.contextSnapshot);
        }
      }

      const response = await getRunDetail(trimmed);

      return readArchitectureDeskDiagramSourcesFromContextSnapshot(response.data.contextSnapshot);
    },
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = runSummaryBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
