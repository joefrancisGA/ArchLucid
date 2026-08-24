"use client";

import { getRunStageTimeline } from "@/lib/api/architecture-runs";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { StageTimelineSummary } from "@/types/stage-timeline";

type UseRunStageTimelineQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunStageTimelineQuery(runId: string, options?: UseRunStageTimelineQueryOptions) {
  const trimmed = runId.trim();

  return createOperatorQueryHook<StageTimelineSummary>({
    queryKey: operatorQueryKeys.runStageTimeline(trimmed),
    queryFn: () => getRunStageTimeline(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}
