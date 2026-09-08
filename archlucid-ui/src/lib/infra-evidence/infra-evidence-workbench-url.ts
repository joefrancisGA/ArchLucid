import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  resourceHubFilterHrefFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

export const DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM = "snapshotId";
export const DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";
export const DRIFT_WORKBENCH_CHANGE_ID_PARAM = "changeId";
export const DRIFT_WORKBENCH_DIFF_ID_PARAM = "diffId";
export const REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";
export const REMEDIATION_WORKBENCH_FINDING_ID_PARAM = "findingId";
export const REMEDIATION_WORKBENCH_INSTANCE_ID_PARAM = "instanceId";
export const REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM = "correspondenceId";
export const REMEDIATION_WORKBENCH_RUN_ID_PARAM = "runId";
export const REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM = "snapshotId";

export type InfraEvidenceWorkbenchContext = {
  readonly cloudResourceId?: string | null;
  readonly snapshotId?: string | null;
  readonly instanceId?: string | null;
  readonly findingId?: string | null;
  readonly correspondenceId?: string | null;
  readonly runId?: string | null;
  readonly changeId?: string | null;
  readonly diffId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
};

export function parseInfraEvidenceWorkbenchQueryValue(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function buildDriftWorkbenchHref(context: InfraEvidenceWorkbenchContext = {}): string {
  const params = new URLSearchParams();

  if (context.snapshotId != null && context.snapshotId.trim().length > 0) {
    params.set(DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM, context.snapshotId.trim());
  }

  if (context.cloudResourceId != null && context.cloudResourceId.trim().length > 0) {
    params.set(DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM, context.cloudResourceId.trim());
  }

  if (context.changeId != null && context.changeId.trim().length > 0) {
    params.set(DRIFT_WORKBENCH_CHANGE_ID_PARAM, context.changeId.trim());
  }

  if (context.diffId != null && context.diffId.trim().length > 0) {
    params.set(DRIFT_WORKBENCH_DIFF_ID_PARAM, context.diffId.trim());
  }

  if (context.assessmentId != null && context.assessmentId.trim().length > 0) {
    params.set(RESOURCE_HUB_ASSESSMENT_ID_PARAM, context.assessmentId.trim());
  }

  if (context.auditEvidenceSnapshotId != null && context.auditEvidenceSnapshotId.trim().length > 0) {
    params.set(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM, context.auditEvidenceSnapshotId.trim());
  }

  if (context.controlId != null && context.controlId.trim().length > 0) {
    params.set(RESOURCE_HUB_CONTROL_ID_PARAM, context.controlId.trim());
  }

  const query = params.toString();

  return query.length === 0 ? GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH : `${GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}?${query}`;
}

export function buildRemediationWorkbenchHref(context: InfraEvidenceWorkbenchContext = {}): string {
  const params = new URLSearchParams();

  if (context.cloudResourceId != null && context.cloudResourceId.trim().length > 0) {
    params.set(REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM, context.cloudResourceId.trim());
  }

  if (context.findingId != null && context.findingId.trim().length > 0) {
    params.set(REMEDIATION_WORKBENCH_FINDING_ID_PARAM, context.findingId.trim());
  }

  if (context.instanceId != null && context.instanceId.trim().length > 0) {
    params.set(REMEDIATION_WORKBENCH_INSTANCE_ID_PARAM, context.instanceId.trim());
  }

  if (context.correspondenceId != null && context.correspondenceId.trim().length > 0) {
    params.set(REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM, context.correspondenceId.trim());
  }

  if (context.runId != null && context.runId.trim().length > 0) {
    params.set(REMEDIATION_WORKBENCH_RUN_ID_PARAM, context.runId.trim());
  }

  if (context.snapshotId != null && context.snapshotId.trim().length > 0) {
    params.set(REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM, context.snapshotId.trim());
  }

  if (context.assessmentId != null && context.assessmentId.trim().length > 0) {
    params.set(RESOURCE_HUB_ASSESSMENT_ID_PARAM, context.assessmentId.trim());
  }

  if (context.auditEvidenceSnapshotId != null && context.auditEvidenceSnapshotId.trim().length > 0) {
    params.set(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM, context.auditEvidenceSnapshotId.trim());
  }

  if (context.controlId != null && context.controlId.trim().length > 0) {
    params.set(RESOURCE_HUB_CONTROL_ID_PARAM, context.controlId.trim());
  }

  const query = params.toString();

  return query.length === 0
    ? GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH
    : `${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH}?${query}`;
}

export function buildResourceHubWorkbenchHref(context: {
  readonly cloudResourceId: string;
  readonly tab?: ResourceHubTab;
  readonly snapshotId?: string | null;
  readonly runId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
}): string {
  return resourceHubFilterHrefFromSearch(context.cloudResourceId, "", {
    tab: context.tab,
    snapshotId: context.snapshotId ?? undefined,
    runId: context.runId ?? undefined,
    assessmentId: context.assessmentId ?? undefined,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId ?? undefined,
    controlId: context.controlId ?? undefined,
  });
}

export function buildResourceScopedWorkbenchHref(
  cloudResourceId: string,
  kind: "findings" | "remediation" | "drift",
  snapshotId?: string | null,
  auditContext?: Pick<
    InfraEvidenceWorkbenchContext,
    "assessmentId" | "auditEvidenceSnapshotId" | "controlId"
  >,
): string {
  switch (kind) {
    case "findings":
      return buildResourceHubWorkbenchHref({ cloudResourceId, tab: "findings", snapshotId });
    case "remediation":
      return buildRemediationWorkbenchHref({ cloudResourceId, snapshotId, ...auditContext });
    case "drift":
      return buildDriftWorkbenchHref({ cloudResourceId, snapshotId, ...auditContext });
    default:
      return governanceInfrastructureResourceHubPath(cloudResourceId);
  }
}
