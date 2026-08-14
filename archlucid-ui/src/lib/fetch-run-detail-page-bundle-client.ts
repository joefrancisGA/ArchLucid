import type { ApiResponseWithTrace } from "@/lib/api";
import { apiGetJsonWithTrace } from "@/lib/api/http";
import type { ArtifactDescriptor, ManifestSummary, PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

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
  return apiGetJsonWithTrace<RunDetailTimelinesBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/timelines-bundle`,
    options,
  ).then((response) => response.data);
}
