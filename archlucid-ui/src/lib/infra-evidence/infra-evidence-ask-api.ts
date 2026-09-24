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
    answer: typeof raw.answer === "string" ? raw.answer : "",
    insufficientEvidence: raw.insufficientEvidence === true,
    simulatorLabel: typeof raw.simulatorLabel === "string" ? raw.simulatorLabel : null,
    viewPlan: parseDiagramViewPlan(raw.viewPlan),
    citations: Array.isArray(raw.citations)
      ? raw.citations.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          if (typeof row.kind !== "string" || typeof row.id !== "string") {
            return [];
          }

          return [{
            kind: row.kind,
            id: row.id,
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
    mermaidMode: typeof row.mermaidMode === "string" ? row.mermaidMode : "",
    resourceGroupName: typeof row.resourceGroupName === "string" ? row.resourceGroupName : null,
    seedNodeId: typeof row.seedNodeId === "string" ? row.seedNodeId : null,
    snapshotId: typeof row.snapshotId === "string" ? row.snapshotId : null,
    cloudResourceId: typeof row.cloudResourceId === "string" ? row.cloudResourceId : null,
    fitTargetNodeId: typeof row.fitTargetNodeId === "string" ? row.fitTargetNodeId : null,
    honestyLabel: typeof row.honestyLabel === "string" ? row.honestyLabel : "Proposed view — existing diagram modes only",
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
