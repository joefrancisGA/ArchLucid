import {
  formatResourceHubTabViewLabel,
} from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { parseInfraEvidenceWorkbenchQueryValue } from "@/lib/infra-evidence/infra-evidence-workbench-url";

export type InfraEvidenceWorkbenchAuditScope = {
  readonly assessmentId: string;
  readonly auditEvidenceSnapshotId: string;
  readonly controlId: string;
};

export function parseInfraEvidenceWorkbenchAuditScopeFromSearch(
  searchParams: Pick<URLSearchParams, "get">,
): InfraEvidenceWorkbenchAuditScope | null {
  const assessmentId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(RESOURCE_HUB_ASSESSMENT_ID_PARAM),
  );
  const auditEvidenceSnapshotId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM),
  );
  const controlId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(RESOURCE_HUB_CONTROL_ID_PARAM));

  if (assessmentId.length === 0 || auditEvidenceSnapshotId.length === 0 || controlId.length === 0) {
    return null;
  }

  return {
    assessmentId,
    auditEvidenceSnapshotId,
    controlId,
  };
}

export function formatResourceHubWorkbenchPrimaryHubLabel(tab: ResourceHubTab): string {
  return formatResourceHubTabViewLabel(tab);
}

export function mergeInfrastructureAskAuditScope(
  auditScope: InfraEvidenceWorkbenchAuditScope | null | undefined,
): {
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
} {
  if (auditScope == null) {
    return {};
  }

  return {
    assessmentId: auditScope.assessmentId,
    auditEvidenceSnapshotId: auditScope.auditEvidenceSnapshotId,
    controlId: auditScope.controlId,
  };
}

export function mergeWorkbenchHubScopePatch(
  snapshotId: string,
  auditScope: InfraEvidenceWorkbenchAuditScope | null,
  runId?: string,
): {
  readonly snapshotId?: string;
  readonly runId?: string;
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
} {
  const patch: {
    snapshotId?: string;
    runId?: string;
    assessmentId?: string;
    auditEvidenceSnapshotId?: string;
    controlId?: string;
  } = {};

  if (snapshotId.trim().length > 0) {
    patch.snapshotId = snapshotId.trim();
  }

  if (runId != null && runId.trim().length > 0) {
    patch.runId = runId.trim();
  }

  if (auditScope != null) {
    patch.assessmentId = auditScope.assessmentId;
    patch.auditEvidenceSnapshotId = auditScope.auditEvidenceSnapshotId;
    patch.controlId = auditScope.controlId;
  }

  return patch;
}
