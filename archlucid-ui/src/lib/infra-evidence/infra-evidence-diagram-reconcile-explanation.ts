import {
  DIAGRAM_INFRASTRUCTURE_MATCH_KINDS,
  type DiagramInfrastructureCorrespondenceRow,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

/** Deterministic explanation column — AI rationale only on Possible/Unknown rows. */
export function formatDiagramReconcileExplanation(row: DiagramInfrastructureCorrespondenceRow): string {
  const parts: string[] = [];

  if (row.explainText.trim().length > 0) {
    parts.push(row.explainText.trim());
  }

  const includeAiRationale =
    row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.possible
    || row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.unknown;

  if (includeAiRationale && row.aiRationale != null && row.aiRationale.trim().length > 0) {
    parts.push(`AI rationale: ${row.aiRationale.trim()}`);
  }

  if (row.securityDiscrepancy) {
    parts.push("Security discrepancy flagged between diagram label and inventory posture.");
  }

  return parts.join(" ");
}

export function buildDiagramReconcileOperationalFindingFingerprint(
  runId: string,
  snapshotId: string,
  correspondenceId: string,
): string {
  return `diagram-reconcile:${runId}:${snapshotId}:${correspondenceId}`;
}

export function buildDiagramReconcileOperationalFindingRequestItem(
  row: DiagramInfrastructureCorrespondenceRow,
  runId: string,
  snapshotId: string,
): {
  provider: number;
  sourceSystem: string;
  sourceFindingId: string;
  cloudResourceId?: string | null;
  externalResourceId?: string | null;
  resourceType?: string | null;
  title: string;
  description?: string | null;
  severity?: string | null;
  status?: string;
  rawEvidenceReference?: string | null;
  metadata?: Record<string, string | null>;
} {
  const label = row.diagramNodeLabel ?? row.azureResourceId ?? row.correspondenceId;
  const severity =
    row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.conflict
      ? "high"
      : row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.diagramOnly
        || row.matchKind === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly
        ? "medium"
        : "low";

  return {
    provider: 1,
    sourceSystem: "DiagramReconciliation",
    sourceFindingId: buildDiagramReconcileOperationalFindingFingerprint(runId, snapshotId, row.correspondenceId),
    cloudResourceId: row.cloudResourceId,
    externalResourceId: row.azureResourceId,
    resourceType: row.resourceType,
    title: `Diagram reconciliation — ${row.matchKind}: ${label}`,
    description: formatDiagramReconcileExplanation(row),
    severity,
    status: "Open",
    rawEvidenceReference: `run:${runId};snapshot:${snapshotId};correspondence:${row.correspondenceId}`,
    metadata: {
      runId,
      snapshotId,
      correspondenceId: row.correspondenceId,
      matchKind: row.matchKind,
      confidenceBand: row.confidenceBand,
      diagramNodeId: row.diagramNodeId,
    },
  };
}
