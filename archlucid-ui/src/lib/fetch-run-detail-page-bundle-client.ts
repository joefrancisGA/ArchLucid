import type { ApiResponseWithTrace } from "@/lib/api";
import { apiGetJsonWithTrace } from "@/lib/api/http";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import {
  tryStaticRunDetailCriticalPageBundle,
  tryStaticRunDetailWorkspaceContextBundle,
} from "@/lib/operator/operator-static-demo";
import type { ArtifactDescriptor, ManifestSummary, PipelineTimelineItem, RunComparison, RunDetail, RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

export type RunDetailWorkspaceContextBundle = {
  readonly recentProjectRuns: RunSummary[];
  readonly priorCommittedRunComparison: RunComparison | null;
  readonly priorCommittedRunId: string | null;
  readonly priorCommittedRunCreatedUtc: string | null;
};

export type RunDetailCriticalPageBundle = {
  readonly buyerSummary: RunDetail;
  readonly progressSummary: RunSummary | null;
  readonly manifestSummary: ManifestSummary | null;
  readonly artifacts: ArtifactDescriptor[];
};

export async function fetchRunDetailCriticalPageBundle(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ApiResponseWithTrace<RunDetailCriticalPageBundle>> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    const staticBundle = tryStaticRunDetailCriticalPageBundle(runId);

    if (staticBundle !== null) {
      return { data: staticBundle, traceId: null };
    }
  }

  const response = await apiGetJsonWithTrace<RunDetailCriticalPageBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/critical-page-bundle`,
    options,
  );

  return response;
}

export type RunDetailTimelinesBundle = {
  readonly pipelineTimeline: PipelineTimelineItem[];
  readonly stageTimeline: StageTimelineSummary[];
};

export async function fetchRunDetailTimelinesBundle(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetailTimelinesBundle> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    return { pipelineTimeline: [], stageTimeline: [] };
  }

  return apiGetJsonWithTrace<RunDetailTimelinesBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/timelines-bundle`,
    options,
  ).then((response) => response.data);
}

export async function fetchRunDetailWorkspaceContextBundle(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetailWorkspaceContextBundle> {
  if (shouldSkipLiveAuthorityRunScopedApi(runId)) {
    const staticBundle = tryStaticRunDetailWorkspaceContextBundle(runId);

    if (staticBundle !== null) {
      return staticBundle;
    }
  }

  const response = await apiGetJsonWithTrace<RunDetailWorkspaceContextBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/workspace-context-bundle`,
    options,
  );

  return response.data;
}
