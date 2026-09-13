import { proxyJsonPost } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { infraEvidenceAskBlockedReason } from "@/lib/infra-evidence/infra-evidence-ask-blocked-reason";
import { formatInfraEvidenceSealedManifestAwareApiError } from "@/lib/infra-evidence/infra-evidence-sealed-manifest-conflict";
import type {
  InfraEvidenceAskRequest,
  InfraEvidenceAskResponse,
} from "@/lib/infra-evidence/infra-evidence-ask-types";
import type { DiagramViewPlan } from "@/lib/infra-evidence/diagram-view-plan-types";

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
  });

  return {
    topicKind: String(raw.topicKind ?? ""),
    answer: String(raw.answer ?? ""),
    insufficientEvidence: Boolean(raw.insufficientEvidence),
    simulatorLabel: raw.simulatorLabel != null ? String(raw.simulatorLabel) : null,
    viewPlan: parseDiagramViewPlan(raw.viewPlan),
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

function parseDiagramViewPlan(raw: unknown): DiagramViewPlan | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;

  return {
    mermaidMode: String(row.mermaidMode ?? ""),
    resourceGroupName: row.resourceGroupName != null ? String(row.resourceGroupName) : null,
    seedNodeId: row.seedNodeId != null ? String(row.seedNodeId) : null,
    snapshotId: row.snapshotId != null ? String(row.snapshotId) : null,
    cloudResourceId: row.cloudResourceId != null ? String(row.cloudResourceId) : null,
    fitTargetNodeId: row.fitTargetNodeId != null ? String(row.fitTargetNodeId) : null,
    honestyLabel: String(row.honestyLabel ?? "Proposed view — existing diagram modes only"),
  };
}

export function formatInfraEvidenceAskApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blockedReason = infraEvidenceAskBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
