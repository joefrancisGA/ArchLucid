import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

export const RESOURCE_EXPLORER_NAME_PREFIX_PARAM = "namePrefix";
export const RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM = "resourceType";
export const RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM = "resourceGroup";
export const RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";

export const RESOURCE_HUB_TAB_PARAM = "tab";
export const RESOURCE_HUB_RUN_ID_PARAM = "runId";
export const RESOURCE_HUB_SNAPSHOT_ID_PARAM = "snapshotId";
export const RESOURCE_HUB_ASSESSMENT_ID_PARAM = "assessmentId";
export const RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM = "auditEvidenceSnapshotId";
export const RESOURCE_HUB_CONTROL_ID_PARAM = "controlId";

const ALLOWED_TABS: ReadonlySet<ResourceHubTab> = new Set([
  "overview",
  "drift",
  "diagram",
  "terraform",
  "findings",
  "remediation",
  "audit",
]);

export function parseResourceExplorerNamePrefixFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseResourceExplorerResourceTypeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseResourceExplorerResourceGroupFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseResourceExplorerCloudResourceIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseResourceHubTabFromSearch(raw: string | null | undefined): ResourceHubTab {
  if (raw === null || raw === undefined) {
    return "overview";
  }

  const trimmed = raw.trim() as ResourceHubTab;

  if (ALLOWED_TABS.has(trimmed)) {
    return trimmed;
  }

  return "overview";
}

export function parseResourceHubQueryValueFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function resourceExplorerFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly namePrefix?: string;
    readonly resourceType?: string;
    readonly resourceGroup?: string;
    readonly cloudResourceId?: string;
  },
  pathname: string = GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.namePrefix !== undefined) {
    const trimmed = patch.namePrefix.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_EXPLORER_NAME_PREFIX_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_NAME_PREFIX_PARAM, trimmed);
    }
  }

  if (patch.resourceType !== undefined) {
    const trimmed = patch.resourceType.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM, trimmed);
    }
  }

  if (patch.resourceGroup !== undefined) {
    const trimmed = patch.resourceGroup.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM, trimmed);
    }
  }

  if (patch.cloudResourceId !== undefined) {
    const trimmed = patch.cloudResourceId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function resourceHubFilterHrefFromSearch(
  cloudResourceId: string,
  currentSearch: string,
  patch: {
    readonly tab?: ResourceHubTab;
    readonly runId?: string;
    readonly snapshotId?: string;
    readonly assessmentId?: string;
    readonly auditEvidenceSnapshotId?: string;
    readonly controlId?: string;
  },
): string {
  const params = new URLSearchParams(currentSearch);
  const pathname = governanceInfrastructureResourceHubPath(cloudResourceId);

  if (patch.tab !== undefined) {
    if (patch.tab === "overview") {
      params.delete(RESOURCE_HUB_TAB_PARAM);
    } else {
      params.set(RESOURCE_HUB_TAB_PARAM, patch.tab);
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

  if (patch.snapshotId !== undefined) {
    const trimmed = patch.snapshotId.trim();

    if (trimmed.length === 0) {
      params.delete(RESOURCE_HUB_SNAPSHOT_ID_PARAM);
    } else {
      params.set(RESOURCE_HUB_SNAPSHOT_ID_PARAM, trimmed);
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
