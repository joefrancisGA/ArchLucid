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
    topicKind: typeof raw.topicKind === "string" ? raw.topicKind : "",
    answer: typeof raw.answer === "string" ? raw.answer : raw.answer == null ? null : "",
    insufficientEvidence: raw.insufficientEvidence === true,
    simulatorLabel: typeof raw.simulatorLabel === "string" ? raw.simulatorLabel : null,
    viewPlan: parseDiagramViewPlan(raw.viewPlan),
    citations: raw.citations == null
      ? null
      : Array.isArray(raw.citations)
      ? raw.citations.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          return [{
            kind: typeof row.kind === "string" ? row.kind : null,
            id: typeof row.id === "string" ? row.id : null,
            label: typeof row.label === "string" ? row.label : null,
          }];
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
    mermaidMode: typeof row.mermaidMode === "string" && row.mermaidMode.trim().length > 0
      ? row.mermaidMode.trim()
      : null,
    resourceGroupName: typeof row.resourceGroupName === "string" && row.resourceGroupName.trim().length > 0
      ? row.resourceGroupName.trim()
      : null,
    seedNodeId: typeof row.seedNodeId === "string" && row.seedNodeId.trim().length > 0
      ? row.seedNodeId.trim()
      : null,
    snapshotId: typeof row.snapshotId === "string" && row.snapshotId.trim().length > 0
      ? row.snapshotId.trim()
      : null,
    cloudResourceId: typeof row.cloudResourceId === "string" && row.cloudResourceId.trim().length > 0
      ? row.cloudResourceId.trim()
      : null,
    fitTargetNodeId: typeof row.fitTargetNodeId === "string" && row.fitTargetNodeId.trim().length > 0
      ? row.fitTargetNodeId.trim()
      : null,
    honestyLabel: typeof row.honestyLabel === "string" && row.honestyLabel.trim().length > 0
      ? row.honestyLabel.trim()
      : null,
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
