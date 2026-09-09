import type {
  FindingEvidenceChain,
  FindingExplainability,
  FindingLlmAudit,
} from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import { mapFindingInspectApiPayload } from "@/lib/findings/finding-inspect-payload-map";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import {
  parseFilenameFromContentDisposition,
  triggerBrowserBlobDownload,
} from "./downloads-blob-trigger-browser";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import {
  apiGet,
  apiPostJson,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
  withCorrelationHeaders,
} from "./http";

/** Read-model inspector: typed payload, rules, evidence citations, audit correlation (ReadAuthority). */
/** Run-scoped: GET /v1/architecture/review/{runId}/findings/{findingId}/inspect */
export type GetFindingInspectOptions = {
  /**
   * When false, omits relational PayloadJson LOB (detail first-paint). Default true keeps full typed payload.
   */
  readonly includeTypedPayload?: boolean;
};

export async function getFindingInspect(
  runId: string,
  findingId: string,
  options?: GetFindingInspectOptions,
): Promise<FindingInspectPayload> {
  const includeTypedPayload = options?.includeTypedPayload ?? true;
  const query = includeTypedPayload ? "" : "?includeTypedPayload=false";

  return mapFindingInspectApiPayload(
    await apiGetSealedManifestAware<Record<string, unknown>>(
      `/v1/architecture/review/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/inspect${query}`,
    ),
  );
}

/** Persisted explainability trace + narrative for a single finding (no LLM). */
export async function getFindingExplainability(runId: string, findingId: string): Promise<FindingExplainability> {
  const encodedFinding = encodeURIComponent(findingId);

  return apiGetSealedManifestAware<FindingExplainability>(
    `/v1/explain/runs/${encodeURIComponent(runId)}/findings/${encodedFinding}/explainability`,
  );
}

/** Evidence-chain pointers for one finding (ReadAuthority; architecture query surface). */
export async function getFindingEvidenceChain(runId: string, findingId: string): Promise<FindingEvidenceChain> {
  const encodedFinding = encodeURIComponent(findingId);

  return apiGetSealedManifestAware<FindingEvidenceChain>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/findings/${encodedFinding}/evidence-chain`,
  );
}

/** Redacted LLM prompt/completion audit for one finding (ReadAuthority). */
export async function getFindingLlmAudit(runId: string, findingId: string): Promise<FindingLlmAudit> {
  const encodedFinding = encodeURIComponent(findingId);

  return apiGetSealedManifestAware<FindingLlmAudit>(
    `/v1/explain/runs/${encodeURIComponent(runId)}/findings/${encodedFinding}/llm-audit`,
  );
}

/** Records thumbs feedback for a finding (ExecuteAuthority). */
export async function postFindingFeedback(
  runId: string,
  findingId: string,
  score: -1 | 1,
): Promise<void> {
  const encodedFinding = encodeURIComponent(findingId);

  await apiPostJson(
    `/v1/explain/runs/${encodeURIComponent(runId)}/findings/${encodedFinding}/feedback`,
    { score },
  );
}

/** Records thumbs feedback via the architecture surface (ExecuteAuthority). */
export async function postArchitectureFindingFeedback(
  runId: string,
  findingId: string,
  isHelpful: boolean,
  comment?: string,
): Promise<void> {
  const encodedFinding = encodeURIComponent(findingId);

  await apiPostJson(`/v1/architecture/finding/${encodedFinding}/feedback`, {
    runId,
    isHelpful,
    comment: comment ?? null,
  });
}

/** Downloads findings CSV for a run (browser only). */
export async function downloadRunFindingsCsv(runId: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadRunFindingsCsv is only available in the browser.");
  }

  await ensureOidcBearerReady();
  const path = `/v1/architecture/review/${encodeURIComponent(runId)}/findings/export/csv`;
  const { url, headers } = await resolveBinaryGetRequest(path);
  const requestHeaders = withCorrelationHeaders(new Headers(headers));
  requestHeaders.set("Accept", "text/csv");
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(requestHeaders);
  const response = await fetch(url, { cache: "no-store", headers: correlatedHeaders });

  if (!response.ok) {
    const text = await response.text();
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    throw new Error(formatExportSealedManifestAwareApiError(failure));
  }

  const blob = await response.blob();
  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `architecture-run-${runId}-findings.csv`;

  await triggerBrowserBlobDownload(blob, fileName);
}

/** Mutes a finding for a run (ExecuteAuthority); persists to relational findings snapshot. */
export async function postFindingMute(
  runId: string,
  findingId: string,
  reason: string,
): Promise<void> {
  const encodedFinding = encodeURIComponent(findingId);

  await apiPostJson(`/v1/findings/${encodedFinding}/mute`, {
    runId,
    reason,
  });
}

export { deleteFindingMute } from "@/lib/findings/finding-unmute-client";
