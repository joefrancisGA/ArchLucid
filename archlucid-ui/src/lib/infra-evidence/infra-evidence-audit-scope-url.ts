import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  resourceHubFilterHrefFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { InfraEvidenceWorkbenchAuditScope } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";

export function buildInfraEvidenceClearAuditScopeHref(
  cloudResourceId: string,
  currentSearch: string,
  activeTab?: ResourceHubTab,
): string {
  return resourceHubFilterHrefFromSearch(cloudResourceId, currentSearch, {
    tab: activeTab,
    assessmentId: "",
    auditEvidenceSnapshotId: "",
    controlId: "",
  });
}

export function buildInfraEvidenceAuditScopeBarAuditTabHref(
  cloudResourceId: string,
  auditScope: InfraEvidenceWorkbenchAuditScope,
  snapshotId?: string | null,
  runId?: string | null,
): string {
  const trimmedSnapshotId = snapshotId?.trim() ?? "";
  const trimmedRunId = runId?.trim() ?? "";

  return resourceHubFilterHrefFromSearch(cloudResourceId, "", {
    tab: "audit",
    snapshotId: trimmedSnapshotId.length > 0 ? trimmedSnapshotId : undefined,
    runId: trimmedRunId.length > 0 ? trimmedRunId : undefined,
    assessmentId: auditScope.assessmentId,
    auditEvidenceSnapshotId: auditScope.auditEvidenceSnapshotId,
    controlId: auditScope.controlId,
  });
}
