import { proxyJsonPost } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type {
  InfraEvidenceAskRequest,
  InfraEvidenceAskResponse,
} from "@/lib/infra-evidence/infra-evidence-ask-types";

const ASK_PATH = "/api/proxy/v1/infra-evidence/ask";

export async function submitInfraEvidenceAsk(
  request: InfraEvidenceAskRequest,
): Promise<InfraEvidenceAskResponse> {
  const raw = await proxyJsonPost<Record<string, unknown>>(ASK_PATH, {
    question: request.question,
    cloudResourceId: request.cloudResourceId ?? undefined,
    runId: request.runId ?? undefined,
    snapshotId: request.snapshotId ?? undefined,
    sinceUtc: request.sinceUtc ?? undefined,
    diffId: request.diffId ?? undefined,
    assessmentId: request.assessmentId ?? undefined,
    auditEvidenceSnapshotId: request.auditEvidenceSnapshotId ?? undefined,
    controlId: request.controlId ?? undefined,
    useSimulator: request.useSimulator ?? false,
  });

  return {
    topicKind: String(raw.topicKind ?? ""),
    answer: String(raw.answer ?? ""),
    insufficientEvidence: Boolean(raw.insufficientEvidence),
    simulatorLabel: raw.simulatorLabel != null ? String(raw.simulatorLabel) : null,
    citations: Array.isArray(raw.citations)
      ? raw.citations.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            kind: String(row.kind ?? ""),
            id: String(row.id ?? ""),
            label: row.label != null ? String(row.label) : null,
          };
        })
      : [],
  };
}

export function formatInfraEvidenceAskApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
