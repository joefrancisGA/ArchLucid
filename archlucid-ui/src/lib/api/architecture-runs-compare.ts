import type { GoldenManifestComparison } from "@/types/comparison";
import type {
  ComparisonExplanation,
  RunExplanation,
} from "@/types/explanation";
import type { RunComparison } from "@/types/authority";
import {
  ensureOidcBearerReady,
  resolveRequest,
  withCorrelationHeaders,
} from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";

type EndToEndReplayComparisonWireResponse = {
  readonly report?: {
    readonly findingCorrelation?: unknown;
    readonly findingLifecycle?: unknown;
    readonly findingLifecycleRecords?: unknown;
    readonly compareQualityDelta?: unknown;
  } | null;
};

/** Full end-to-end replay comparison report (includes finding correlation metadata for export parity). */
export async function compareRunsEndToEnd(
  leftRunId: string,
  rightRunId: string,
): Promise<EndToEndReplayComparisonWireResponse> {
  return apiGetSealedManifestAware<EndToEndReplayComparisonWireResponse>(
    `/v1/architecture/review/compare/end-to-end?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`,
  );
}

/** Legacy flat-diff comparison between two runs (run-level + optional manifest diffs). */
export async function compareRuns(leftRunId: string, rightRunId: string): Promise<RunComparison> {
  return apiGetSealedManifestAware<RunComparison>(
    `/v1/authority/compare/runs?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`,
  );
}

/** Structured golden manifest comparison (decision/requirement/security/topology/cost deltas). */
export async function compareGoldenManifestRuns(
  baseRunId: string,
  targetRunId: string,
): Promise<GoldenManifestComparison> {
  return apiGetSealedManifestAware<GoldenManifestComparison>(
    `/v1/compare?baseRunId=${encodeURIComponent(baseRunId)}&targetRunId=${encodeURIComponent(targetRunId)}`,
  );
}

/** Requests an AI-generated narrative explanation of the differences between two runs. */
export async function explainComparisonRuns(
  baseRunId: string,
  targetRunId: string,
): Promise<ComparisonExplanation> {
  return apiGetSealedManifestAware<ComparisonExplanation>(
    `/v1/explain/compare/explain?baseRunId=${encodeURIComponent(baseRunId)}&targetRunId=${encodeURIComponent(targetRunId)}`,
  );
}

/** Requests an AI-generated explanation of a single run's decisions and implications. */
export async function explainRun(runId: string): Promise<RunExplanation> {
  return apiGetSealedManifestAware<RunExplanation>(`/v1/explain/runs/${encodeURIComponent(runId)}/explain`);
}

/**
 * Fetches the sponsor first-value report (Markdown body) for a run.
 * Returns `null` when the API responds 404 (run not found / not committed yet).
 */
export async function getFirstValueReportMarkdown(runId: string): Promise<string | null> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(`/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`);
  const baseHeaders = withCorrelationHeaders(headers);
  baseHeaders.set("Accept", "text/markdown");
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(baseHeaders);
  const response = await fetch(url, { cache: "no-store", headers: correlatedHeaders });
  const text = await response.text();

  if (response.status === 404) return null;

  if (!response.ok) {
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    throw new Error(formatExportSealedManifestAwareApiError(failure));
  }

  return text;
}
