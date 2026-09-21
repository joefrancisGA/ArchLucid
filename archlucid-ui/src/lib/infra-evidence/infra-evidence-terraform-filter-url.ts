import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { infrastructureTerraformPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { resolveProductLineId } from "@/lib/product-line/resolve-product-line-id";
import {
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

export const INFRA_TERRAFORM_SNAPSHOT_ID_PARAM = "snapshotId";
export const INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";

export type InfraTerraformWorkbenchContext = {
  readonly snapshotId?: string | null;
  readonly cloudResourceId?: string | null;
  readonly runId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
};

const INFRA_TERRAFORM_WORKBENCH_PATHS = [
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
] as const;

export function isInfraTerraformWorkbenchPath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?")[0] ?? pathname;

  return INFRA_TERRAFORM_WORKBENCH_PATHS.some((path) => bare === path);
}

export function parseInfraTerraformWorkbenchPath(href: string): {
  readonly cloudResourceId: string;
  readonly snapshotId: string;
} | null {
  const [path = "", search = ""] = href.split("?");

  if (!isInfraTerraformWorkbenchPath(path)) {
    return null;
  }

  const params = new URLSearchParams(search);
  const cloudResourceId = params.get(INFRA_TERRAFORM_CLOUD_RESOURCE_ID_PARAM)?.trim() ?? "";
  const snapshotId = params.get(INFRA_TERRAFORM_SNAPSHOT_ID_PARAM)?.trim() ?? "";

  if (cloudResourceId.length === 0) {
    return null;
  }

  return { cloudResourceId, snapshotId };
}

export function buildTerraformWorkbenchHref(context: InfraTerraformWorkbenchContext = {}): string {
  return infraTerraformFilterHrefFromSearch("", {
    snapshotId: context.snapshotId ?? undefined,
    cloudResourceId: context.cloudResourceId ?? undefined,
    runId: context.runId ?? undefined,
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
    readonly runId?: string;
    readonly assessmentId?: string;
    readonly auditEvidenceSnapshotId?: string;
    readonly controlId?: string;
  },
  pathname: string = infrastructureTerraformPathForProductLine(resolveProductLineId()),
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

  if (patch.runId !== undefined) {
    const trimmed = patch.runId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_RUN_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_RUN_ID_PARAM, trimmed);
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
