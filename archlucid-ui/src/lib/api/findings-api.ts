import type {
  FindingEvidenceChain,
  FindingExplainability,
  FindingLlmAudit,
} from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import { apiGet, apiPostJson } from "./http";

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
