import type {
  FindingEvidenceChain,
  FindingExplainability,
  FindingLlmAudit,
} from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import {
  apiGet,
  apiPostJson,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "./http";

/** Read-model inspector: typed payload, rules, evidence citations, audit correlation (ReadAuthority). */
/** Run-scoped: GET /v1/architecture/run/{runId}/findings/{findingId}/inspect */
export async function getFindingInspect(runId: string, findingId: string): Promise<FindingInspectPayload> {
  return apiGet<FindingInspectPayload>(
    `/v1/architecture/run/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/inspect`,
  );
}

/** Persisted explainability trace + narrative for a single finding (no LLM). */
export async function getFindingExplainability(runId: string, findingId: string): Promise<FindingExplainability> {
  const encodedFinding = encodeURIComponent(findingId);

  return apiGet<FindingExplainability>(
    `/v1/explain/runs/${encodeURIComponent(runId)}/findings/${encodedFinding}/explainability`,
  );
}

/** Evidence-chain pointers for one finding (ReadAuthority; architecture query surface). */
export async function getFindingEvidenceChain(runId: string, findingId: string): Promise<FindingEvidenceChain> {
  const encodedFinding = encodeURIComponent(findingId);

  return apiGet<FindingEvidenceChain>(
    `/v1/architecture/run/${encodeURIComponent(runId)}/findings/${encodedFinding}/evidence-chain`,
  );
}

/** Redacted LLM prompt/completion audit for one finding (ReadAuthority). */
export async function getFindingLlmAudit(runId: string, findingId: string): Promise<FindingLlmAudit> {
  const encodedFinding = encodeURIComponent(findingId);

  return apiGet<FindingLlmAudit>(
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
  const path = `/v1/architecture/run/${encodeURIComponent(runId)}/findings/export/csv`;
  const { url, headers } = resolveBinaryGetRequest(path);
  const requestHeaders = withCorrelationHeaders(new Headers(headers));
  requestHeaders.set("Accept", "text/csv");
  const response = await fetch(url, { cache: "no-store", headers: requestHeaders });

  if (!response.ok) {
    const text = await response.text();
    throwApiRequestError(response, text);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fileNameMatch = /filename="?([^";]+)"?/i.exec(disposition);
  const fileName = fileNameMatch?.[1] ?? `architecture-run-${runId}-findings.csv`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
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
