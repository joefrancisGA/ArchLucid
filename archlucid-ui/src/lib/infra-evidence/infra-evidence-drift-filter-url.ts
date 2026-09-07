import {
  buildDriftWorkbenchHref,
  DRIFT_WORKBENCH_CHANGE_ID_PARAM,
  DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM,
  DRIFT_WORKBENCH_DIFF_ID_PARAM,
  DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM,
  parseInfraEvidenceWorkbenchQueryValue,
  type InfraEvidenceWorkbenchContext,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

function readDriftWorkbenchParam(
  searchParams: URLSearchParams,
  param: string,
  patchValue?: string | null,
): string {
  if (patchValue !== undefined) {
    return patchValue?.trim() ?? "";
  }

  return parseInfraEvidenceWorkbenchQueryValue(searchParams.get(param));
}

export function driftWorkbenchHrefFromSearch(
  searchParams: URLSearchParams,
  patch: Partial<InfraEvidenceWorkbenchContext> = {},
): string {
  const snapshotId = readDriftWorkbenchParam(searchParams, DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM, patch.snapshotId);
  const cloudResourceId = readDriftWorkbenchParam(searchParams, DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM, patch.cloudResourceId);
  const changeId = readDriftWorkbenchParam(searchParams, DRIFT_WORKBENCH_CHANGE_ID_PARAM, patch.changeId);
  const diffId = readDriftWorkbenchParam(searchParams, DRIFT_WORKBENCH_DIFF_ID_PARAM, patch.diffId);
  const assessmentId = readDriftWorkbenchParam(searchParams, RESOURCE_HUB_ASSESSMENT_ID_PARAM, patch.assessmentId);
  const auditEvidenceSnapshotId = readDriftWorkbenchParam(
    searchParams,
    RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
    patch.auditEvidenceSnapshotId,
  );
  const controlId = readDriftWorkbenchParam(searchParams, RESOURCE_HUB_CONTROL_ID_PARAM, patch.controlId);

  return buildDriftWorkbenchHref({
    snapshotId: snapshotId.length > 0 ? snapshotId : null,
    cloudResourceId: cloudResourceId.length > 0 ? cloudResourceId : null,
    changeId: changeId.length > 0 ? changeId : null,
    diffId: diffId.length > 0 ? diffId : null,
    assessmentId: assessmentId.length > 0 ? assessmentId : null,
    auditEvidenceSnapshotId: auditEvidenceSnapshotId.length > 0 ? auditEvidenceSnapshotId : null,
    controlId: controlId.length > 0 ? controlId : null,
  });
}
