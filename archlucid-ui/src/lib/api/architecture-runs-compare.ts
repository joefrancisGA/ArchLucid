import type { GoldenManifestComparison } from "@/types/comparison";
import type {
  ComparisonExplanation,
  RunExplanation,
} from "@/types/explanation";
import type { RunComparison } from "@/types/authority";
import {
  apiGet,
  ensureOidcBearerReady,
  resolveRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "./http";

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
  return apiGet<EndToEndReplayComparisonWireResponse>(
    `/v1/architecture/review/compare/end-to-end?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`,
  );
}

/** Legacy flat-diff comparison between two runs (run-level + optional manifest diffs). */
export async function compareRuns(leftRunId: string, rightRunId: string): Promise<RunComparison> {
  return apiGet<RunComparison>(
    `/v1/authority/compare/runs?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`,
  );
}

/** Structured golden manifest comparison (decision/requirement/security/topology/cost deltas). */
export async function compareGoldenManifestRuns(
  baseRunId: string,
  targetRunId: string,
): Promise<GoldenManifestComparison> {
  return apiGet<GoldenManifestComparison>(
    `/v1/compare?baseRunId=${encodeURIComponent(baseRunId)}&targetRunId=${encodeURIComponent(targetRunId)}`,
  );
}

/** Requests an AI-generated narrative explanation of the differences between two runs. */
export async function explainComparisonRuns(
  baseRunId: string,
  targetRunId: string,
): Promise<ComparisonExplanation> {
  return apiGet<ComparisonExplanation>(
    `/v1/explain/compare/explain?baseRunId=${encodeURIComponent(baseRunId)}&targetRunId=${encodeURIComponent(targetRunId)}`,
  );
}

/** Requests an AI-generated explanation of a single run's decisions and implications. */
export async function explainRun(runId: string): Promise<RunExplanation> {
  return apiGet<RunExplanation>(`/v1/explain/runs/${encodeURIComponent(runId)}/explain`);
}

/**
 * Fetches the sponsor first-value report (Markdown body) for a run.
 * Returns `null` when the API responds 404 (run not found / not committed yet).
 */
export async function getFirstValueReportMarkdown(runId: string): Promise<string | null> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(`/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`);
  const h = withCorrelationHeaders(headers);
  h.set("Accept", "text/markdown");
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) return null;

  if (!response.ok) throwApiRequestError(response, text);

  return text;
}
