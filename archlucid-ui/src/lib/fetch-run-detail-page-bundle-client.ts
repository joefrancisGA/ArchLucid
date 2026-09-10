import type { ApiResponseWithTrace } from "@/lib/api";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { apiGet } from "@/lib/api/http";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { runDetailPageBundleBlockedReason } from "@/lib/runs/run-detail-page-bundle-blocked-reason";
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
  readonly priorCommittedRunComparisonBlockedReason: string | null;
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

  const data = await fetchRunDetailCriticalPageBundleSealedManifestAware<RunDetailCriticalPageBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/critical-page-bundle`,
    options,
  );

  return { data, traceId: null };
}

async function fetchRunDetailCriticalPageBundleSealedManifestAware<T>(
  path: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<T> {
  try {
    return await apiGet<T>(path, options);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runDetailPageBundleBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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

  return apiGetSealedManifestAware<RunDetailTimelinesBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/timelines-bundle`,
    options,
  );
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

  return apiGetSealedManifestAware<RunDetailWorkspaceContextBundle>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/workspace-context-bundle`,
    options,
  );
}
