import {
  buildRemediationWorkbenchHref,
  parseInfraEvidenceWorkbenchQueryValue,
  REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM,
  REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM,
  REMEDIATION_WORKBENCH_FINDING_ID_PARAM,
  REMEDIATION_WORKBENCH_INSTANCE_ID_PARAM,
  REMEDIATION_WORKBENCH_RUN_ID_PARAM,
  REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM,
  type InfraEvidenceWorkbenchContext,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

export function remediationWorkbenchHrefFromSearch(
  searchParams: URLSearchParams,
  patch: Partial<InfraEvidenceWorkbenchContext> = {},
): string {
  const readParam = (key: string, patchValue?: string | null): string => {
    if (patchValue !== undefined) {
      return patchValue?.trim() ?? "";
    }

    return parseInfraEvidenceWorkbenchQueryValue(searchParams.get(key));
  };

  return buildRemediationWorkbenchHref({
    cloudResourceId: readParam(REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM, patch.cloudResourceId)?.length
      ? readParam(REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM, patch.cloudResourceId)
      : null,
    snapshotId: readParam(REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM, patch.snapshotId)?.length
      ? readParam(REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM, patch.snapshotId)
      : null,
    findingId: readParam(REMEDIATION_WORKBENCH_FINDING_ID_PARAM, patch.findingId)?.length
      ? readParam(REMEDIATION_WORKBENCH_FINDING_ID_PARAM, patch.findingId)
      : null,
    instanceId: readParam(REMEDIATION_WORKBENCH_INSTANCE_ID_PARAM, patch.instanceId)?.length
      ? readParam(REMEDIATION_WORKBENCH_INSTANCE_ID_PARAM, patch.instanceId)
      : null,
    correspondenceId: readParam(REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM, patch.correspondenceId)?.length
      ? readParam(REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM, patch.correspondenceId)
      : null,
    runId: readParam(REMEDIATION_WORKBENCH_RUN_ID_PARAM, patch.runId)?.length
      ? readParam(REMEDIATION_WORKBENCH_RUN_ID_PARAM, patch.runId)
      : null,
    assessmentId: readParam(RESOURCE_HUB_ASSESSMENT_ID_PARAM, patch.assessmentId)?.length
      ? readParam(RESOURCE_HUB_ASSESSMENT_ID_PARAM, patch.assessmentId)
      : null,
    auditEvidenceSnapshotId: readParam(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM, patch.auditEvidenceSnapshotId)?.length
      ? readParam(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM, patch.auditEvidenceSnapshotId)
      : null,
    controlId: readParam(RESOURCE_HUB_CONTROL_ID_PARAM, patch.controlId)?.length
      ? readParam(RESOURCE_HUB_CONTROL_ID_PARAM, patch.controlId)
      : null,
  });
}
