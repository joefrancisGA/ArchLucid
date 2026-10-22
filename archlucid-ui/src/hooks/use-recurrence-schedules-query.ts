"use client";

import { listArchitectureReviewRecurrenceSchedules } from "@/lib/api/governance-stickiness-api-exceptions-schedules";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { recurrenceSchedulesBlockedReason } from "@/lib/governance/governance-stickiness-list-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseRecurrenceSchedulesQueryOptions = {
  readonly enabled?: boolean;
};

export function useRecurrenceSchedulesQuery(options?: UseRecurrenceSchedulesQueryOptions) {
  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.governanceRecurrenceSchedules(),
    queryFn: () => listArchitectureReviewRecurrenceSchedules(),
    enabled: options?.enabled ?? true,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = recurrenceSchedulesBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
