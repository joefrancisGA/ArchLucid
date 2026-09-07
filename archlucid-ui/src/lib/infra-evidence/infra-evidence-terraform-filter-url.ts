import { GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

export const INFRA_TERRAFORM_SNAPSHOT_ID_PARAM = "snapshotId";
export const INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";

export type InfraTerraformWorkbenchContext = {
  readonly snapshotId?: string | null;
  readonly cloudResourceId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
};

export function buildTerraformWorkbenchHref(context: InfraTerraformWorkbenchContext = {}): string {
  return infraTerraformFilterHrefFromSearch("", {
    snapshotId: context.snapshotId ?? undefined,
    cloudResourceId: context.cloudResourceId ?? undefined,
    assessmentId: context.assessmentId ?? undefined,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId ?? undefined,
    controlId: context.controlId ?? undefined,
  });
}

export function infraTerraformFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly snapshotId?: string;
    readonly cloudResourceId?: string;
    readonly assessmentId?: string;
    readonly auditEvidenceSnapshotId?: string;
    readonly controlId?: string;
  },
  pathname: string = GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.snapshotId !== undefined) {
    const trimmed = patch.snapshotId.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_TERRAFORM_SNAPSHOT_ID_PARAM);
    } else {
      params.set(INFRA_TERRAFORM_SNAPSHOT_ID_PARAM, trimmed);
    }
  }

  if (patch.cloudResourceId !== undefined) {
    const trimmed = patch.cloudResourceId.trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM);
    } else {
      params.set(INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM, trimmed);
    }
  }

  if (patch.assessmentId !== undefined) {
    const trimmed = patch.assessmentId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_ASSESSMENT_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_ASSESSMENT_ID_PARAM, trimmed);
    }
  }

  if (patch.auditEvidenceSnapshotId !== undefined) {
    const trimmed = patch.auditEvidenceSnapshotId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM, trimmed);
    }
  }

  if (patch.controlId !== undefined) {
    const trimmed = patch.controlId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_CONTROL_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_CONTROL_ID_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
