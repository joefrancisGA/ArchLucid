import { toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type {
  ArchitectureDiagramModelRecord,
  DiagramInfrastructureReconciliationResult,
  OperationalSecurityFindingBatchIngestResult,
  OperationalSecurityFindingIngestRequest,
  StructuredDiagramIngestRequest,
  StructuredDiagramIngestResult,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

function diagramsBasePath(runId: string): string {
  return `/api/proxy/v1/architecture/runs/${runId}/diagrams`;
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
  const params = new URLSearchParams({ snapshotId });
  return proxyJsonGet<DiagramInfrastructureReconciliationResult>(
    `${diagramsBasePath(runId)}/reconciliation?${params.toString()}`,
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

export function formatInfraEvidenceDiagramReconcileApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
