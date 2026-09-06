import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { InfraEvidenceAskCitation } from "@/lib/infra-evidence/infra-evidence-ask-types";

export type InfraEvidenceAskCitationLink = {
  href: string;
  label: string;
};

export function resolveInfraEvidenceAskCitationLink(
  citation: InfraEvidenceAskCitation,
): InfraEvidenceAskCitationLink | null {
  const id = citation.id.trim();

  if (id.length === 0) {
    return null;
  }

  const label = citation.label?.trim().length ? citation.label.trim() : `${citation.kind}: ${id}`;

  switch (citation.kind) {
    case "CloudResourceId":
      return { href: governanceInfrastructureResourceHubPath(id), label };
    case "ChangeId":
      return { href: `${GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}?changeId=${encodeURIComponent(id)}`, label };
    case "SnapshotId":
      return { href: `${GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=${encodeURIComponent(id)}`, label };
    case "DiffId":
      return { href: `${GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}?diffId=${encodeURIComponent(id)}`, label };
    case "FindingId":
      return null;
    case "DiagramCorrespondenceId":
      return {
        href: `${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH}?correspondenceId=${encodeURIComponent(id)}`,
        label,
      };
    case "RemediationInstanceId":
      return {
        href: `${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH}?instanceId=${encodeURIComponent(id)}`,
        label,
      };
    case "PatternKey":
      return { href: `${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH}?patternKey=${encodeURIComponent(id)}`, label };
    case "AuditLineageControlId":
      return { href: `/governance/audit-evidence/${encodeURIComponent(id)}`, label };
    default:
      return null;
  }
}

export function buildResourceHubDriftWorkbenchHref(snapshotId: string | null | undefined): string {
  if (snapshotId == null || snapshotId.trim().length === 0) {
    return GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH;
  }

  return `${GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=${encodeURIComponent(snapshotId.trim())}`;
}

export function buildResourceHubDiagramsWorkbenchHref(snapshotId: string | null | undefined): string {
  if (snapshotId == null || snapshotId.trim().length === 0) {
    return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH;
  }

  return `${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH}?snapshotId=${encodeURIComponent(snapshotId.trim())}`;
}

export function buildResourceHubDiagramReconcileWorkbenchHref(
  snapshotId: string | null | undefined,
  runId: string | null | undefined,
): string {
  const params = new URLSearchParams();

  if (snapshotId != null && snapshotId.trim().length > 0) {
    params.set("snapshotId", snapshotId.trim());
  }

  if (runId != null && runId.trim().length > 0) {
    params.set("runId", runId.trim());
  }

  const query = params.toString();

  return query.length === 0
    ? GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH
    : `${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH}?${query}`;
}

export function buildAuditEvidenceLineageUiPath(
  assessmentId: string,
  auditEvidenceSnapshotId: string,
  controlId: string,
): string {
  return `/governance/audit-evidence/${assessmentId}/snapshots/${auditEvidenceSnapshotId}/controls/${controlId}`;
}
