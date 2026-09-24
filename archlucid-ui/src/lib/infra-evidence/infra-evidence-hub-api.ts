import { proxyJsonGet } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { formatInfraEvidenceSealedManifestAwareApiError } from "@/lib/infra-evidence/infra-evidence-sealed-manifest-conflict";
import { infraEvidenceHubBlockedReason } from "@/lib/infra-evidence/infra-evidence-hub-blocked-reason";
import { tryWorkbookInfraResourceHubDemoFallback } from "@/lib/infra-evidence/infra-resource-hub-demo-fallback";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { resourceExplorerWorkQueueApiValue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type {
  CloudResourceEvidenceHubResponse,
  CloudResourceExplorerPage,
  ResourceHubQueryContext,
} from "@/lib/infra-evidence/infra-evidence-hub-types";

const CLOUD_RESOURCES_PATH = "/api/proxy/v1/infra-evidence/cloud-resources";

export type CloudResourceExplorerFilters = {
  namePrefix?: string | null;
  resourceType?: string | null;
  resourceGroup?: string | null;
  workQueue?: CloudResourceExplorerWorkQueue;
};

export async function fetchCloudResourceExplorerPage(
  filters: CloudResourceExplorerFilters,
  page = 1,
  pageSize = 50,
): Promise<CloudResourceExplorerPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (filters.namePrefix != null && filters.namePrefix.trim().length > 0) {
    params.set("namePrefix", filters.namePrefix.trim());
  }

  if (filters.resourceType != null && filters.resourceType.trim().length > 0) {
    params.set("resourceType", filters.resourceType.trim());
  }

  if (filters.resourceGroup != null && filters.resourceGroup.trim().length > 0) {
    params.set("resourceGroup", filters.resourceGroup.trim());
  }

  const workQueue = resourceExplorerWorkQueueApiValue(filters.workQueue ?? "all");

  if (workQueue != null) {
    params.set("workQueue", workQueue);
  }

  const raw = await proxyJsonGet<{
    items?: Array<{
      cloudResourceId?: string;
      externalResourceId?: string;
      displayName?: string | null;
      resourceType?: string | null;
      resourceGroup?: string | null;
      region?: string | null;
      lastSeenUtc?: string;
      workCounts?: {
        openOperationalFindingsCount?: number;
        openRemediationInstancesCount?: number;
        inventoryDriftChangeCount?: number;
      } | null;
    }>;
    totalCount?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  }>(`${CLOUD_RESOURCES_PATH}?${params.toString()}`);

  const items = (raw.items ?? []).map((row) => ({
    cloudResourceId: row.cloudResourceId ?? "",
    externalResourceId: row.externalResourceId ?? "",
    displayName: row.displayName ?? null,
    resourceType: row.resourceType ?? null,
    resourceGroup: row.resourceGroup ?? null,
    region: row.region ?? null,
    lastSeenUtc: row.lastSeenUtc ?? "",
    workCounts: row.workCounts == null
      ? null
      : {
          openOperationalFindingsCount: row.workCounts.openOperationalFindingsCount ?? 0,
          openRemediationInstancesCount: row.workCounts.openRemediationInstancesCount ?? 0,
          inventoryDriftChangeCount: row.workCounts.inventoryDriftChangeCount ?? 0,
        },
  }));

  return {
    items,
    totalCount: raw.totalCount ?? items.length,
    page: raw.page ?? page,
    pageSize: raw.pageSize ?? pageSize,
    hasMore: raw.hasMore ?? false,
  };
}

export async function fetchCloudResourceEvidenceHub(
  cloudResourceId: string,
  context: Partial<ResourceHubQueryContext>,
  page = 1,
  pageSize = 25,
): Promise<CloudResourceEvidenceHubResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (context.runId != null && context.runId.trim().length > 0) {
    params.set("runId", context.runId.trim());
  }

  if (context.snapshotId != null && context.snapshotId.trim().length > 0) {
    params.set("snapshotId", context.snapshotId.trim());
  }

  if (context.assessmentId != null && context.assessmentId.trim().length > 0) {
    params.set("assessmentId", context.assessmentId.trim());
  }

  if (context.auditEvidenceSnapshotId != null && context.auditEvidenceSnapshotId.trim().length > 0) {
    params.set("auditEvidenceSnapshotId", context.auditEvidenceSnapshotId.trim());
  }

  if (context.controlId != null && context.controlId.trim().length > 0) {
    params.set("controlId", context.controlId.trim());
  }

  try {
    const raw = await proxyJsonGet<Record<string, unknown>>(
      `${CLOUD_RESOURCES_PATH}/${cloudResourceId}/hub?${params.toString()}`,
    );

    return mapHubResponse(raw);
  } catch (error: unknown) {
    const demoFallback = tryWorkbookInfraResourceHubDemoFallback(cloudResourceId);

    if (demoFallback !== null) {
      return demoFallback;
    }

    const failure = toApiLoadFailure(error);
    const blockedReason = infraEvidenceHubBlockedReason(failure);

    throw new Error(blockedReason ?? formatInfraEvidenceSealedManifestAwareApiError(failure));
  }
}

function stringRecord(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function mapHubResponse(raw: Record<string, unknown>): CloudResourceEvidenceHubResponse {
  const finiteNumberOr = (value: unknown, fallback: number): number => {
    const parsed = typeof value === "number" ? value : Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const mapFindingStream = (stream: Record<string, unknown> | undefined) => ({
    streamKind: String(stream?.streamKind ?? ""),
    streamLabel: String(stream?.streamLabel ?? ""),
    items: Array.isArray(stream?.items)
      ? stream.items.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          if (typeof row.id !== "string" || typeof row.title !== "string") {
            return [];
          }

          return [{
            id: row.id,
            title: row.title,
            severity: typeof row.severity === "string" ? row.severity : null,
            status: typeof row.status === "string" ? row.status : null,
            streamKind: typeof row.streamKind === "string" ? row.streamKind : "",
            streamLabel: typeof row.streamLabel === "string" ? row.streamLabel : "",
          }];
        })
      : [],
    totalCount: finiteNumberOr(stream?.totalCount, 0),
    page: finiteNumberOr(stream?.page, 1),
    pageSize: finiteNumberOr(stream?.pageSize, 25),
    hasMore: stream?.hasMore === true,
  });

  const mapRemediationStream = (stream: Record<string, unknown> | undefined) => ({
    items: Array.isArray(stream?.items)
      ? stream.items.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          if (
            typeof row.instanceId !== "string"
            || typeof row.patternKey !== "string"
            || typeof row.status !== "string"
          ) {
            return [];
          }

          return [{
            instanceId: row.instanceId,
            patternKey: row.patternKey,
            status: row.status,
          }];
        })
      : [],
    totalCount: finiteNumberOr(stream?.totalCount, 0),
    page: finiteNumberOr(stream?.page, 1),
    pageSize: finiteNumberOr(stream?.pageSize, 25),
    hasMore: stream?.hasMore === true,
  });

  const currentConfigurationRaw = raw.currentConfiguration as Record<string, unknown> | null | undefined;
  const diagramRaw = raw.diagramCorrespondence as Record<string, unknown> | null | undefined;
  const auditRaw = raw.auditLineageLink as Record<string, unknown> | undefined;

  return {
    cloudResourceId: typeof raw.cloudResourceId === "string" ? raw.cloudResourceId : "",
    externalResourceId: typeof raw.externalResourceId === "string" ? raw.externalResourceId : "",
    resourceType: typeof raw.resourceType === "string" ? raw.resourceType : null,
    currentConfiguration:
      currentConfigurationRaw == null
        ? null
        : {
            snapshotId: typeof currentConfigurationRaw.snapshotId === "string" ? currentConfigurationRaw.snapshotId : "",
            azureResourceId: typeof currentConfigurationRaw.azureResourceId === "string" ? currentConfigurationRaw.azureResourceId : "",
            resourceType: typeof currentConfigurationRaw.resourceType === "string" ? currentConfigurationRaw.resourceType : "",
            resourceGroup:
              typeof currentConfigurationRaw.resourceGroup === "string"
                ? currentConfigurationRaw.resourceGroup
                : null,
            region: typeof currentConfigurationRaw.region === "string" ? currentConfigurationRaw.region : null,
            properties: stringRecord(currentConfigurationRaw.properties),
            tags: stringRecord(currentConfigurationRaw.tags),
          },
    terraformAddress: typeof raw.terraformAddress === "string" ? raw.terraformAddress : null,
    terraformGenerationMethod:
      typeof raw.terraformGenerationMethod === "string" ? raw.terraformGenerationMethod : null,
    diagramCorrespondence:
      diagramRaw == null
        ? null
        : {
            correspondenceId: typeof diagramRaw.correspondenceId === "string" ? diagramRaw.correspondenceId : "",
            diagramNodeId: typeof diagramRaw.diagramNodeId === "string" ? diagramRaw.diagramNodeId : null,
            diagramNodeLabel: typeof diagramRaw.diagramNodeLabel === "string" ? diagramRaw.diagramNodeLabel : null,
            cloudResourceId: typeof diagramRaw.cloudResourceId === "string" ? diagramRaw.cloudResourceId : null,
            azureResourceId: typeof diagramRaw.azureResourceId === "string" ? diagramRaw.azureResourceId : null,
            resourceType: typeof diagramRaw.resourceType === "string" ? diagramRaw.resourceType : null,
            resourceGroup: typeof diagramRaw.resourceGroup === "string" ? diagramRaw.resourceGroup : null,
            terraformAddress: typeof diagramRaw.terraformAddress === "string" ? diagramRaw.terraformAddress : null,
            matchKind: typeof diagramRaw.matchKind === "string" ? diagramRaw.matchKind : "",
            confidenceBand: typeof diagramRaw.confidenceBand === "string" ? diagramRaw.confidenceBand : "",
            explainText: typeof diagramRaw.explainText === "string" ? diagramRaw.explainText : "",
            aiRationale: typeof diagramRaw.aiRationale === "string" ? diagramRaw.aiRationale : null,
            securityDiscrepancy: diagramRaw.securityDiscrepancy === true,
          },
    operationalSecurityFindings: mapFindingStream(
      raw.operationalSecurityFindings as Record<string, unknown> | undefined,
    ),
    architectureReviewFindings: mapFindingStream(
      raw.architectureReviewFindings as Record<string, unknown> | undefined,
    ),
    remediationInstances: mapRemediationStream(
      raw.remediationInstances as Record<string, unknown> | undefined,
    ),
    rbacAssignments: Array.isArray(raw.rbacAssignments)
      ? raw.rbacAssignments.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          if (
            typeof row.principalId !== "string"
            || typeof row.roleDefinitionId !== "string"
            || typeof row.scope !== "string"
          ) {
            return [];
          }

          return [{
            principalId: row.principalId,
            roleDefinitionId: row.roleDefinitionId,
            scope: row.scope,
          }];
        })
      : [],
    networkRelationships: Array.isArray(raw.networkRelationships)
      ? raw.networkRelationships.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          if (
            typeof row.relationshipType !== "string"
            || typeof row.fromAzureResourceId !== "string"
            || typeof row.toAzureResourceId !== "string"
          ) {
            return [];
          }

          return [{
            relationshipType: row.relationshipType,
            fromAzureResourceId: row.fromAzureResourceId,
            toAzureResourceId: row.toAzureResourceId,
          }];
        })
      : [],
    recentChanges: Array.isArray(raw.recentChanges)
      ? raw.recentChanges.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            changeId: String(row.changeId ?? ""),
            diffId: String(row.diffId ?? ""),
            snapshotAId: String(row.snapshotAId ?? ""),
            snapshotBId: String(row.snapshotBId ?? ""),
            changeType: String(row.changeType ?? ""),
            property: row.property != null ? String(row.property) : null,
            oldValue: row.oldValue != null ? String(row.oldValue) : null,
            newValue: row.newValue != null ? String(row.newValue) : null,
            riskClassification: row.riskClassification != null ? String(row.riskClassification) : null,
          };
        })
      : [],
    auditLineageLink: {
      available: Boolean(auditRaw?.available),
      degradedReason: auditRaw?.degradedReason != null ? String(auditRaw.degradedReason) : null,
      relativePath: auditRaw?.relativePath != null ? String(auditRaw.relativePath) : null,
      assessmentId: auditRaw?.assessmentId != null ? String(auditRaw.assessmentId) : null,
      auditEvidenceSnapshotId:
        auditRaw?.auditEvidenceSnapshotId != null ? String(auditRaw.auditEvidenceSnapshotId) : null,
      controlId: auditRaw?.controlId != null ? String(auditRaw.controlId) : null,
      controlNumber: auditRaw?.controlNumber != null ? String(auditRaw.controlNumber) : null,
      controlTitle: auditRaw?.controlTitle != null ? String(auditRaw.controlTitle) : null,
      matches: Array.isArray(auditRaw?.matches)
        ? auditRaw.matches.map((item) => {
            const row = item as Record<string, unknown>;

            return {
              assessmentId: String(row.assessmentId ?? ""),
              auditEvidenceSnapshotId: String(row.auditEvidenceSnapshotId ?? ""),
              controlId: String(row.controlId ?? ""),
              controlNumber: String(row.controlNumber ?? ""),
              controlTitle: String(row.controlTitle ?? ""),
              snapshotCreatedUtc: String(row.snapshotCreatedUtc ?? ""),
            };
          })
        : [],
    },
    evidencePointers: Array.isArray(raw.evidencePointers)
      ? raw.evidencePointers.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            kind: String(row.kind ?? ""),
            relativePath: String(row.relativePath ?? ""),
          };
        })
      : [],
  };
}

export function formatInfraEvidenceHubApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blockedReason = infraEvidenceHubBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
