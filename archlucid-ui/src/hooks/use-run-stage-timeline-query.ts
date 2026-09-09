"use client";

import { getRunStageTimeline } from "@/lib/api/architecture-runs";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { runPipelineTimelineBlockedReason } from "@/lib/runs/run-pipeline-timeline-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { StageTimelineSummary } from "@/types/stage-timeline";

type UseRunStageTimelineQueryOptions = {
  readonly enabled?: boolean;
  readonly refetchInterval?: number | false;
  readonly pollSession?: number;
};

export function useRunStageTimelineQuery(runId: string, options?: UseRunStageTimelineQueryOptions) {
  const trimmed = runId.trim();
  const pollSession = options?.pollSession ?? 0;

  const query = createOperatorQueryHook<StageTimelineSummary[]>({
    queryKey: [...operatorQueryKeys.runStageTimeline(trimmed), { pollSession }] as const,
    queryFn: () => getRunStageTimeline(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = runPipelineTimelineBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
