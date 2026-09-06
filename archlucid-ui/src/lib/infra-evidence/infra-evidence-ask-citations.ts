import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { buildDiagramReconcileWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import { buildDiagramsWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";
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
  readonly findingId?: string | null;
  readonly correspondenceId?: string | null;
  readonly runId?: string | null;
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
  const findingId = context.findingId?.trim() ?? "";
  const correspondenceId = context.correspondenceId?.trim() ?? "";
  const runId = context.runId?.trim() ?? "";
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
          correspondenceId: correspondenceId.length > 0 ? correspondenceId : null,
          runId: runId.length > 0 ? runId : null,
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
        }),
        label,
      };
    case "DiagramCorrespondenceId":
      return {
        href: buildDiagramReconcileWorkbenchHref({
          correspondenceId: id,
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
          runId: runId.length > 0 ? runId : null,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
          reconcileFilter: "Conflict",
        }),
        label,
      };
    case "RemediationInstanceId":
      return {
        href: buildRemediationWorkbenchHref({
          instanceId: id,
          cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
          correspondenceId: correspondenceId.length > 0 ? correspondenceId : null,
          runId: runId.length > 0 ? runId : null,
          snapshotId: snapshotId.length > 0 ? snapshotId : null,
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
  auditContext?: {
    readonly assessmentId?: string | null;
    readonly auditEvidenceSnapshotId?: string | null;
    readonly controlId?: string | null;
  },
): string {
  return buildDriftWorkbenchHref({
    snapshotId,
    cloudResourceId,
    assessmentId: auditContext?.assessmentId,
    auditEvidenceSnapshotId: auditContext?.auditEvidenceSnapshotId,
    controlId: auditContext?.controlId,
  });
}

export function buildResourceHubDiagramsWorkbenchHref(
  snapshotId: string | null | undefined,
  cloudResourceId?: string | null,
  externalResourceId?: string | null,
  auditContext?: {
    readonly assessmentId?: string | null;
    readonly auditEvidenceSnapshotId?: string | null;
    readonly controlId?: string | null;
  },
): string {
  const seedNodeId = externalResourceId?.trim() ?? "";

  return buildDiagramsWorkbenchHref({
    snapshotId,
    cloudResourceId,
    mermaidMode: seedNodeId.length > 0 ? "dependencyNeighborhood" : undefined,
    seedNodeId: seedNodeId.length > 0 ? seedNodeId : undefined,
    assessmentId: auditContext?.assessmentId,
    auditEvidenceSnapshotId: auditContext?.auditEvidenceSnapshotId,
    controlId: auditContext?.controlId,
  });
}

export function buildResourceHubDiagramReconcileWorkbenchHref(
  snapshotId: string | null | undefined,
  runId: string | null | undefined,
  correspondenceId?: string | null,
  cloudResourceId?: string | null,
  auditContext?: {
    readonly assessmentId?: string | null;
    readonly auditEvidenceSnapshotId?: string | null;
    readonly controlId?: string | null;
  },
): string {
  return buildDiagramReconcileWorkbenchHref({
    snapshotId,
    runId,
    correspondenceId,
    cloudResourceId,
    assessmentId: auditContext?.assessmentId,
    auditEvidenceSnapshotId: auditContext?.auditEvidenceSnapshotId,
    controlId: auditContext?.controlId,
  });
}

export function buildAuditEvidenceLineageUiPath(
  assessmentId: string,
  auditEvidenceSnapshotId: string,
  controlId: string,
): string {
  return `/governance/audit-evidence/${assessmentId}/snapshots/${auditEvidenceSnapshotId}/controls/${controlId}`;
}
