import {
  buildResourceHubDiagramReconcileWorkbenchHref,
  buildResourceHubDiagramsWorkbenchHref,
  buildResourceHubDriftWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-ask-citations";
import type { InfrastructureAskAuditContext } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { CloudResourceInventoryChangeSummary } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildTerraformWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import {
  buildDriftWorkbenchHref,
  buildRemediationWorkbenchHref,
  type InfraEvidenceWorkbenchContext,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";

export type ScopedInfraWorkbenchKind =
  | "drift"
  | "remediation"
  | "diagrams"
  | "diagram-reconcile"
  | "terraform";

export type ScopedInfraWorkbenchRequest = InfraEvidenceWorkbenchContext & {
  readonly externalResourceId?: string | null;
  readonly runId?: string | null;
};

export function mergeWorkbenchAuditIntoContext(
  context: ScopedInfraWorkbenchRequest,
  auditContext?: InfrastructureAskAuditContext | null,
): ScopedInfraWorkbenchRequest {
  if (auditContext == null) {
    return context;
  }

  return {
    ...context,
    assessmentId: auditContext.assessmentId ?? context.assessmentId,
    auditEvidenceSnapshotId: auditContext.auditEvidenceSnapshotId ?? context.auditEvidenceSnapshotId,
    controlId: auditContext.controlId ?? context.controlId,
  };
}

export function buildScopedInfraWorkbenchHref(
  kind: ScopedInfraWorkbenchKind,
  context: ScopedInfraWorkbenchRequest,
  auditContext?: InfrastructureAskAuditContext | null,
): string {
  const scopedContext = mergeWorkbenchAuditIntoContext(context, auditContext);

  switch (kind) {
    case "drift":
      return buildDriftWorkbenchHref(scopedContext);
    case "remediation":
      return buildRemediationWorkbenchHref(scopedContext);
    case "diagrams":
      return buildResourceHubDiagramsWorkbenchHref(
        scopedContext.snapshotId,
        scopedContext.cloudResourceId,
        scopedContext.externalResourceId,
        scopedContext,
      );
    case "diagram-reconcile":
      return buildResourceHubDiagramReconcileWorkbenchHref(
        scopedContext.snapshotId,
        scopedContext.runId,
        scopedContext.correspondenceId,
        scopedContext.cloudResourceId,
        scopedContext,
      );
    case "terraform":
      return buildTerraformWorkbenchHref({
        cloudResourceId: scopedContext.cloudResourceId,
        snapshotId: scopedContext.snapshotId,
        assessmentId: scopedContext.assessmentId,
        auditEvidenceSnapshotId: scopedContext.auditEvidenceSnapshotId,
        controlId: scopedContext.controlId,
      });
    default:
      return buildDriftWorkbenchHref(scopedContext);
  }
}

export function buildScopedHubDriftChangeWorkbenchHref(
  cloudResourceId: string,
  snapshotId: string,
  change: CloudResourceInventoryChangeSummary,
  auditContext?: InfrastructureAskAuditContext | null,
): string {
  return buildScopedInfraWorkbenchHref(
    "drift",
    {
      cloudResourceId,
      snapshotId,
      changeId: change.changeId,
      diffId: change.diffId,
    },
    auditContext,
  );
}

export function buildScopedHubDriftWorkbenchHref(
  snapshotId: string,
  cloudResourceId: string,
  auditContext?: InfrastructureAskAuditContext | null,
): string {
  return buildResourceHubDriftWorkbenchHref(snapshotId, cloudResourceId, auditContext ?? undefined);
}
