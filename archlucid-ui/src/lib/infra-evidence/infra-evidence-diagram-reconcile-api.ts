import { toApiLoadFailure } from "@/lib/api-load-failure";
import { diagramIngestMutationBlockedReason } from "@/lib/infra-evidence/diagram-ingest-mutation-blocked-reason";
import { diagramReconcileLoadModelBlockedReason } from "@/lib/infra-evidence/diagram-reconcile-load-model-blocked-reason";
import { diagramReconcileMutationBlockedReason } from "@/lib/infra-evidence/diagram-reconcile-mutation-blocked-reason";
import { formatInfraEvidenceSealedManifestAwareApiError } from "@/lib/infra-evidence/infra-evidence-sealed-manifest-conflict";
import { proxyJsonGet, proxyJsonPost, proxyJsonPut } from "@/lib/proxy-json-client";
import type {
  ArchitectureDiagramModelRecord,
  DiagramInfrastructureReconciliationResult,
  InfrastructureDiagramComparisonCreateRequest,
  InfrastructureDiagramNodeMappingSaveRequest,
  InfrastructureDiagramDocumentationDecision,
  InfrastructureDiagramDocumentationDecisionSaveRequest,
  OperationalSecurityFindingBatchIngestResult,
  OperationalSecurityFindingIngestRequest,
  OperationalSecurityFindingLookupItem,
  OperationalSecurityFindingLookupRequest,
  StructuredDiagramIngestRequest,
  StructuredDiagramIngestResult,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

function diagramsBasePath(runId: string): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    throw new Error("runId is required.");
  }

  return `/api/proxy/v1/architecture/runs/${encodeURIComponent(trimmed)}/diagrams`;
}

export async function fetchArchitectureDiagramModel(runId: string): Promise<ArchitectureDiagramModelRecord> {
  return proxyJsonGet<ArchitectureDiagramModelRecord>(`${diagramsBasePath(runId)}/model`);
}

export async function ingestArchitectureDiagram(
  runId: string,
  request: StructuredDiagramIngestRequest,
): Promise<StructuredDiagramIngestResult> {
  return proxyJsonPost<StructuredDiagramIngestResult>(`${diagramsBasePath(runId)}/ingest`, request);
}

export async function reconcileArchitectureDiagram(
  runId: string,
  snapshotId: string,
): Promise<DiagramInfrastructureReconciliationResult> {
  return proxyJsonPost<DiagramInfrastructureReconciliationResult>(`${diagramsBasePath(runId)}/reconcile`, {
    snapshotId,
  });
}

export async function fetchArchitectureDiagramReconciliation(
  runId: string,
  snapshotId: string,
): Promise<DiagramInfrastructureReconciliationResult> {
  const params = new URLSearchParams({ snapshotId: snapshotId.trim() });
  return proxyJsonGet<DiagramInfrastructureReconciliationResult>(
    `${diagramsBasePath(runId)}/reconciliation?${params.toString()}`,
  );
}

export async function saveSealedInfrastructureDiagramDocumentationDecision(
  runId: string,
  request: InfrastructureDiagramDocumentationDecisionSaveRequest,
): Promise<InfrastructureDiagramDocumentationDecision> {
  return proxyJsonPut<InfrastructureDiagramDocumentationDecision>(
    `${diagramsBasePath(runId)}/documentation-decisions`,
    request,
  );
}

export async function fetchSealedInfrastructureDiagramDocumentationDecisions(
  runId: string,
  snapshotId: string,
): Promise<InfrastructureDiagramDocumentationDecision[]> {
  const params = new URLSearchParams({ snapshotId: snapshotId.trim() });
  return proxyJsonGet<InfrastructureDiagramDocumentationDecision[]>(
    `${diagramsBasePath(runId)}/documentation-decisions?${params.toString()}`,
  );
}

const ADVISORY_DIAGRAM_COMPARISONS_BASE = "/api/proxy/v1/infrastructure/diagram-comparisons";

export async function compareInfrastructureDiagramAdvisory(
  request: InfrastructureDiagramComparisonCreateRequest,
): Promise<DiagramInfrastructureReconciliationResult> {
  return proxyJsonPost<DiagramInfrastructureReconciliationResult>(ADVISORY_DIAGRAM_COMPARISONS_BASE, request);
}

export async function fetchInfrastructureDiagramComparison(
  comparisonId: string,
): Promise<DiagramInfrastructureReconciliationResult> {
  const trimmedComparisonId = comparisonId.trim();

  if (trimmedComparisonId.length === 0) {
    throw new Error("comparisonId is required.");
  }

  return proxyJsonGet<DiagramInfrastructureReconciliationResult>(
    `${ADVISORY_DIAGRAM_COMPARISONS_BASE}/${encodeURIComponent(trimmedComparisonId)}`,
  );
}

export async function saveInfrastructureDiagramNodeMapping(
  comparisonId: string,
  request: InfrastructureDiagramNodeMappingSaveRequest,
): Promise<DiagramInfrastructureReconciliationResult> {
  const trimmedComparisonId = comparisonId.trim();

  return proxyJsonPut<DiagramInfrastructureReconciliationResult>(
    `${ADVISORY_DIAGRAM_COMPARISONS_BASE}/${encodeURIComponent(trimmedComparisonId)}/node-mappings`,
    request,
  );
}

export async function saveInfrastructureDiagramDocumentationDecision(
  comparisonId: string,
  request: InfrastructureDiagramDocumentationDecisionSaveRequest,
): Promise<InfrastructureDiagramDocumentationDecision> {
  const trimmedComparisonId = comparisonId.trim();

  return proxyJsonPut<InfrastructureDiagramDocumentationDecision>(
    `${ADVISORY_DIAGRAM_COMPARISONS_BASE}/${encodeURIComponent(trimmedComparisonId)}/documentation-decisions`,
    request,
  );
}

export async function fetchInfrastructureDiagramDocumentationDecision(
  comparisonId: string,
  subjectKind: InfrastructureDiagramDocumentationDecision["subjectKind"],
  subjectKey: string,
): Promise<InfrastructureDiagramDocumentationDecision> {
  const trimmedComparisonId = comparisonId.trim();

  const params = new URLSearchParams({ subjectKind, subjectKey });
  return proxyJsonGet<InfrastructureDiagramDocumentationDecision>(
    `${ADVISORY_DIAGRAM_COMPARISONS_BASE}/${encodeURIComponent(trimmedComparisonId)}/documentation-decisions?${params.toString()}`,
  );
}

export async function fetchAbsentInfrastructureDiagramDocumentationDecisions(
  comparisonId: string,
): Promise<InfrastructureDiagramDocumentationDecision[]> {
  return proxyJsonGet<InfrastructureDiagramDocumentationDecision[]>(
    `${ADVISORY_DIAGRAM_COMPARISONS_BASE}/${comparisonId}/documentation-decisions/absent`,
  );
}

export async function ingestOperationalSecurityFindings(
  request: OperationalSecurityFindingIngestRequest,
): Promise<OperationalSecurityFindingBatchIngestResult> {
  return proxyJsonPost<OperationalSecurityFindingBatchIngestResult>(
    "/api/proxy/v1/operational-security/findings/ingest",
    request,
  );
}

export async function lookupOperationalSecurityFindings(
  request: OperationalSecurityFindingLookupRequest,
): Promise<OperationalSecurityFindingLookupItem[]> {
  return proxyJsonPost<OperationalSecurityFindingLookupItem[]>(
    "/api/proxy/v1/operational-security/findings/lookup",
    request,
  );
}

export function formatInfraEvidenceDiagramReconcileApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blockedReason =
    diagramReconcileLoadModelBlockedReason(failure)
    ?? diagramIngestMutationBlockedReason(failure)
    ?? diagramReconcileMutationBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
