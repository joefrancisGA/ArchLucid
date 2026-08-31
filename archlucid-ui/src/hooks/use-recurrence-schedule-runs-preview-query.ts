"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { previewRecurrenceScheduleRuns } from "@/lib/api/governance-stickiness-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS, OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

export type RecurrenceScheduleRunsPreviewResult = {
  readonly isValid: boolean;
  readonly validationError: string | null;
  readonly nextRunUtc: readonly string[];
};

const PREVIEW_DEBOUNCE_MS = 250;

type UseRecurrenceScheduleRunsPreviewQueryOptions = {
  readonly count?: number;
  readonly enabled?: boolean;
  readonly debounceMs?: number;
};

export function useRecurrenceScheduleRunsPreviewQuery(
  cronExpression: string,
  options?: UseRecurrenceScheduleRunsPreviewQueryOptions,
) {
  const trimmed = cronExpression.trim();
  const count = options?.count ?? 5;
  const debounceMs = options?.debounceMs ?? PREVIEW_DEBOUNCE_MS;
  const [debouncedCron, setDebouncedCron] = useState(trimmed);

  useEffect(() => {
    if (trimmed.length === 0) {
      setDebouncedCron("");

      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedCron(trimmed);
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [debounceMs, trimmed]);

  // Call useQuery directly so React Compiler tracks hook order (createOperatorQueryHook is not a use* hook).
  return useQuery<RecurrenceScheduleRunsPreviewResult>({
    queryKey: operatorQueryKeys.recurrenceScheduleRunsPreview(debouncedCron, count),
    queryFn: async () => {
      const response = await previewRecurrenceScheduleRuns({
        cronExpression: debouncedCron,
        count,
      });

      return {
        isValid: response.isValid,
        validationError: response.validationError ?? null,
        nextRunUtc: response.nextRunUtc ?? [],
      };
    },
    enabled: (options?.enabled ?? true) && debouncedCron.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
