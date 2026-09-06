import { proxyJsonGet } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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

  const raw = await proxyJsonGet<{
    items?: Array<{
      cloudResourceId?: string;
      externalResourceId?: string;
      displayName?: string | null;
      resourceType?: string | null;
      resourceGroup?: string | null;
      region?: string | null;
      lastSeenUtc?: string;
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

  const raw = await proxyJsonGet<Record<string, unknown>>(
    `${CLOUD_RESOURCES_PATH}/${cloudResourceId}/hub?${params.toString()}`,
  );

  return mapHubResponse(raw);
}

function mapHubResponse(raw: Record<string, unknown>): CloudResourceEvidenceHubResponse {
  const mapFindingStream = (stream: Record<string, unknown> | undefined) => ({
    streamKind: String(stream?.streamKind ?? ""),
    streamLabel: String(stream?.streamLabel ?? ""),
    items: Array.isArray(stream?.items)
      ? stream.items.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            id: String(row.id ?? ""),
            title: String(row.title ?? ""),
            severity: row.severity != null ? String(row.severity) : null,
            status: row.status != null ? String(row.status) : null,
            streamKind: String(row.streamKind ?? ""),
            streamLabel: String(row.streamLabel ?? ""),
          };
        })
      : [],
    totalCount: Number(stream?.totalCount ?? 0),
    page: Number(stream?.page ?? 1),
    pageSize: Number(stream?.pageSize ?? 25),
    hasMore: Boolean(stream?.hasMore),
  });

  const mapRemediationStream = (stream: Record<string, unknown> | undefined) => ({
    items: Array.isArray(stream?.items)
      ? stream.items.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            instanceId: String(row.instanceId ?? ""),
            patternKey: String(row.patternKey ?? ""),
            status: String(row.status ?? ""),
          };
        })
      : [],
    totalCount: Number(stream?.totalCount ?? 0),
    page: Number(stream?.page ?? 1),
    pageSize: Number(stream?.pageSize ?? 25),
    hasMore: Boolean(stream?.hasMore),
  });

  const currentConfigurationRaw = raw.currentConfiguration as Record<string, unknown> | null | undefined;
  const diagramRaw = raw.diagramCorrespondence as Record<string, unknown> | null | undefined;
  const auditRaw = raw.auditLineageLink as Record<string, unknown> | undefined;

  return {
    cloudResourceId: String(raw.cloudResourceId ?? ""),
    externalResourceId: String(raw.externalResourceId ?? ""),
    resourceType: raw.resourceType != null ? String(raw.resourceType) : null,
    currentConfiguration:
      currentConfigurationRaw == null
        ? null
        : {
            snapshotId: String(currentConfigurationRaw.snapshotId ?? ""),
            azureResourceId: String(currentConfigurationRaw.azureResourceId ?? ""),
            resourceType: String(currentConfigurationRaw.resourceType ?? ""),
            resourceGroup:
              currentConfigurationRaw.resourceGroup != null
                ? String(currentConfigurationRaw.resourceGroup)
                : null,
            region: currentConfigurationRaw.region != null ? String(currentConfigurationRaw.region) : null,
            properties: (currentConfigurationRaw.properties as Record<string, string>) ?? {},
            tags: (currentConfigurationRaw.tags as Record<string, string>) ?? {},
          },
    terraformAddress: raw.terraformAddress != null ? String(raw.terraformAddress) : null,
    terraformGenerationMethod:
      raw.terraformGenerationMethod != null ? String(raw.terraformGenerationMethod) : null,
    diagramCorrespondence:
      diagramRaw == null
        ? null
        : {
            correspondenceId: String(diagramRaw.correspondenceId ?? ""),
            diagramNodeId: diagramRaw.diagramNodeId != null ? String(diagramRaw.diagramNodeId) : null,
            diagramNodeLabel: diagramRaw.diagramNodeLabel != null ? String(diagramRaw.diagramNodeLabel) : null,
            cloudResourceId: diagramRaw.cloudResourceId != null ? String(diagramRaw.cloudResourceId) : null,
            azureResourceId: diagramRaw.azureResourceId != null ? String(diagramRaw.azureResourceId) : null,
            resourceType: diagramRaw.resourceType != null ? String(diagramRaw.resourceType) : null,
            resourceGroup: diagramRaw.resourceGroup != null ? String(diagramRaw.resourceGroup) : null,
            terraformAddress: diagramRaw.terraformAddress != null ? String(diagramRaw.terraformAddress) : null,
            matchKind: String(diagramRaw.matchKind ?? ""),
            confidenceBand: String(diagramRaw.confidenceBand ?? ""),
            explainText: String(diagramRaw.explainText ?? ""),
            aiRationale: diagramRaw.aiRationale != null ? String(diagramRaw.aiRationale) : null,
            securityDiscrepancy: Boolean(diagramRaw.securityDiscrepancy),
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
      ? raw.rbacAssignments.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            principalId: String(row.principalId ?? ""),
            roleDefinitionId: String(row.roleDefinitionId ?? ""),
            scope: String(row.scope ?? ""),
          };
        })
      : [],
    networkRelationships: Array.isArray(raw.networkRelationships)
      ? raw.networkRelationships.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            relationshipType: String(row.relationshipType ?? ""),
            fromAzureResourceId: String(row.fromAzureResourceId ?? ""),
            toAzureResourceId: String(row.toAzureResourceId ?? ""),
          };
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
  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
