import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  governanceInfrastructureResourceHubPath,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { resolveResourceHubTabFromExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type { CloudResourceExplorerWorkCountKind } from "@/lib/infra-evidence/infra-evidence-explorer-work-counts";

export const RESOURCE_EXPLORER_NAME_PREFIX_PARAM = "namePrefix";
export const RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM = "resourceType";
export const RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM = "resourceGroup";
export const RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM = "cloudResourceId";
export const RESOURCE_EXPLORER_WORK_QUEUE_PARAM = "workQueue";

export const RESOURCE_HUB_TAB_PARAM = "tab";
export const RESOURCE_HUB_RUN_ID_PARAM = "runId";
export const RESOURCE_HUB_SNAPSHOT_ID_PARAM = "snapshotId";
export const RESOURCE_HUB_ASSESSMENT_ID_PARAM = "assessmentId";
export const RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM = "auditEvidenceSnapshotId";
export const RESOURCE_HUB_CONTROL_ID_PARAM = "controlId";
export const RESOURCE_HUB_DIFF_ID_PARAM = "diffId";
export const RESOURCE_HUB_FINDING_ID_PARAM = "findingId";
export const RESOURCE_HUB_INSTANCE_ID_PARAM = "instanceId";
export const RESOURCE_HUB_CORRESPONDENCE_ID_PARAM = "correspondenceId";
export const RESOURCE_HUB_SEED_NODE_ID_PARAM = "seedNodeId";

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

export function buildInfrastructureAskHref(context: {
  readonly cloudResourceId?: string;
  readonly snapshotId?: string;
  readonly diffId?: string;
  readonly findingId?: string;
  readonly instanceId?: string;
  readonly correspondenceId?: string;
  readonly runId?: string;
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
  readonly workQueue?: CloudResourceExplorerWorkQueue;
  readonly seedNodeId?: string;
}): string {
  const params = new URLSearchParams();

  if (context.cloudResourceId != null && context.cloudResourceId.trim().length > 0) {
    params.set(RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM, context.cloudResourceId.trim());
  }

  if (context.snapshotId != null && context.snapshotId.trim().length > 0) {
    params.set(RESOURCE_HUB_SNAPSHOT_ID_PARAM, context.snapshotId.trim());
  }

  if (context.diffId != null && context.diffId.trim().length > 0) {
    params.set(RESOURCE_HUB_DIFF_ID_PARAM, context.diffId.trim());
  }

  if (context.findingId != null && context.findingId.trim().length > 0) {
    params.set(RESOURCE_HUB_FINDING_ID_PARAM, context.findingId.trim());
  }

  if (context.instanceId != null && context.instanceId.trim().length > 0) {
    params.set(RESOURCE_HUB_INSTANCE_ID_PARAM, context.instanceId.trim());
  }

  if (context.correspondenceId != null && context.correspondenceId.trim().length > 0) {
    params.set(RESOURCE_HUB_CORRESPONDENCE_ID_PARAM, context.correspondenceId.trim());
  }

  if (context.runId != null && context.runId.trim().length > 0) {
    params.set(RESOURCE_HUB_RUN_ID_PARAM, context.runId.trim());
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

  if (context.workQueue != null && context.workQueue !== "all") {
    params.set(RESOURCE_EXPLORER_WORK_QUEUE_PARAM, context.workQueue);
  }

  if (context.seedNodeId != null && context.seedNodeId.trim().length > 0) {
    params.set(RESOURCE_HUB_SEED_NODE_ID_PARAM, context.seedNodeId.trim());
  }

  const query = params.toString();

  return query.length === 0
    ? GOVERNANCE_INFRASTRUCTURE_ASK_PATH
    : `${GOVERNANCE_INFRASTRUCTURE_ASK_PATH}?${query}`;
}

export function resolveResourceHubTabFromAskScope(context: {
  readonly findingId?: string;
  readonly instanceId?: string;
  readonly diffId?: string;
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
  readonly correspondenceId?: string;
}): ResourceHubTab | undefined {
  if (context.findingId != null && context.findingId.trim().length > 0) {
    return "findings";
  }

  if (context.instanceId != null && context.instanceId.trim().length > 0) {
    return "remediation";
  }

  if (
    context.assessmentId != null
    && context.assessmentId.trim().length > 0
    && context.auditEvidenceSnapshotId != null
    && context.auditEvidenceSnapshotId.trim().length > 0
    && context.controlId != null
    && context.controlId.trim().length > 0
  ) {
    return "audit";
  }

  if (context.correspondenceId != null && context.correspondenceId.trim().length > 0) {
    return "diagram";
  }

  if (context.diffId != null && context.diffId.trim().length > 0) {
    return "drift";
  }

  return undefined;
}

export function resourceExplorerFilterHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly namePrefix?: string;
    readonly resourceType?: string;
    readonly resourceGroup?: string;
    readonly cloudResourceId?: string;
    readonly workQueue?: CloudResourceExplorerWorkQueue;
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

  if (patch.workQueue !== undefined) {
    if (patch.workQueue === "all") {
      params.delete(RESOURCE_EXPLORER_WORK_QUEUE_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_WORK_QUEUE_PARAM, patch.workQueue);
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

export function buildResourceHubExplorerHref(
  cloudResourceId: string,
  workQueue: CloudResourceExplorerWorkQueue = "all",
): string {
  const tab = resolveResourceHubTabFromExplorerWorkQueue(workQueue);

  return resourceHubFilterHrefFromSearch(cloudResourceId, "", tab != null ? { tab } : {});
}

export function buildResourceHubWorkCountHref(
  cloudResourceId: string,
  kind: CloudResourceExplorerWorkCountKind,
): string {
  return resourceHubFilterHrefFromSearch(cloudResourceId, "", { tab: kind });
}
