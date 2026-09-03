"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchUserAttentionSummaryFromApi,
  type UserAttentionSummaryResponse,
} from "@/lib/api/user-attention-summary";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

const USER_ATTENTION_SUMMARY_STALE_MS = 30_000;

export function useUserAttentionSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: operatorQueryKeys.userAttentionSummary,
    queryFn: fetchUserAttentionSummaryFromApi,
    staleTime: USER_ATTENTION_SUMMARY_STALE_MS,
    enabled,
  });
}

export function mapUserAttentionSummaryToSurfaceCounts(
  summary: UserAttentionSummaryResponse | undefined,
): {
  readonly assignedToMeFindingsCount?: number;
  readonly awaitingApprovalCount?: number;
  readonly alertsOpenCount?: number;
} {
  if (summary === undefined) {
    return {};
  }

  return {
    assignedToMeFindingsCount: summary.assignedToMeFindingsCount,
    awaitingApprovalCount: summary.awaitingApprovalCount,
    alertsOpenCount: summary.alertsOpenCount,
  };
}
