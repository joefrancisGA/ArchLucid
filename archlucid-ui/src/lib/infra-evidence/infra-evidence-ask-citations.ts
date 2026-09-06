import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { buildDiagramReconcileWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import { resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  buildDriftWorkbenchHref,
  buildRemediationWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import type { InfraEvidenceAskCitation } from "@/lib/infra-evidence/infra-evidence-ask-types";

export type InfraEvidenceAskCitationContext = {
  readonly cloudResourceId?: string | null;
  readonly snapshotId?: string | null;
  readonly diffId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
};

export type InfraEvidenceAskCitationLink = {
  href: string;
  label: string;
};

export function resolveInfraEvidenceAskCitationLink(
  citation: InfraEvidenceAskCitation,
  context: InfraEvidenceAskCitationContext = {},
): InfraEvidenceAskCitationLink | null {
  const id = citation.id.trim();

  if (id.length === 0) {
    return null;
  }

  const label = citation.label?.trim().length ? citation.label.trim() : `${citation.kind}: ${id}`;
  const cloudResourceId = context.cloudResourceId?.trim() ?? "";
  const snapshotId = context.snapshotId?.trim() ?? "";
  const diffId = context.diffId?.trim() ?? "";
  const assessmentId = context.assessmentId?.trim() ?? "";
  const auditEvidenceSnapshotId = context.auditEvidenceSnapshotId?.trim() ?? "";

  switch (citation.kind) {
    case "CloudResourceId":
      return {
        href: resourceHubFilterHrefFromSearch(id, "", {
          snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
        }),
        label,
      };
    case "ChangeId":
      return {
        href: buildDriftWorkbenchHref({
          changeId: id,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
          diffId: diffId.length > 0 ? diffId : null,
        }),
        label,
      };
    case "SnapshotId":
      return {
        href: buildDriftWorkbenchHref({
          snapshotId: id,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
        }),
        label,
      };
    case "DiffId":
      return {
        href: buildDriftWorkbenchHref({
          diffId: id,
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
        }),
        label,
      };
    case "FindingId":
      return {
        href: buildRemediationWorkbenchHref({
          findingId: id,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
        }),
        label,
      };
    case "DiagramCorrespondenceId":
      return {
        href: buildDiagramReconcileWorkbenchHref({
          correspondenceId: id,
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
        }),
        label,
      };
    case "RemediationInstanceId":
      return {
        href: buildRemediationWorkbenchHref({
          instanceId: id,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
        }),
        label,
      };
    case "PatternKey":
      return { href: `${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH}?patternKey=${encodeURIComponent(id)}`, label };
    case "AuditLineageControlId":
      if (assessmentId.length > 0 && auditEvidenceSnapshotId.length > 0) {
        return {
          href: buildAuditEvidenceLineageUiPath(assessmentId, auditEvidenceSnapshotId, id),
          label,
        };
      }

      return null;
    default:
      return null;
  }
}

export function buildResourceHubDriftWorkbenchHref(
  snapshotId: string | null | undefined,
  cloudResourceId?: string | null,
): string {
  return buildDriftWorkbenchHref({ snapshotId, cloudResourceId });
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
  correspondenceId?: string | null,
  cloudResourceId?: string | null,
): string {
  return buildDiagramReconcileWorkbenchHref({
    snapshotId,
    runId,
    correspondenceId,
    cloudResourceId,
  });
}

export function buildAuditEvidenceLineageUiPath(
  assessmentId: string,
  auditEvidenceSnapshotId: string,
  controlId: string,
): string {
  return `/governance/audit-evidence/${assessmentId}/snapshots/${auditEvidenceSnapshotId}/controls/${controlId}`;
}
