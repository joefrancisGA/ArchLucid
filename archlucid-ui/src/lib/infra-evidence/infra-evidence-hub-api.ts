import { proxyJsonGet } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  finiteNonNegativeNumberOrDefault,
} from "@/lib/parse-finite-number";
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

type CloudResourceExplorerApiRow = {
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
};

type CompleteCloudResourceExplorerApiRow = CloudResourceExplorerApiRow & {
  cloudResourceId: string;
  externalResourceId: string;
  lastSeenUtc: string;
};

function hasCloudResourceExplorerIdentity(
  row: CloudResourceExplorerApiRow,
): row is CompleteCloudResourceExplorerApiRow {
  return typeof row.cloudResourceId === "string"
    && typeof row.externalResourceId === "string"
    && typeof row.lastSeenUtc === "string";
}

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
    items?: CloudResourceExplorerApiRow[];
    totalCount?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  }>(`${CLOUD_RESOURCES_PATH}?${params.toString()}`);

  const items = (raw.items ?? [])
.filter((row): row is CompleteCloudResourceExplorerApiRow => row != null && hasCloudResourceExplorerIdentity(row))
    .map((row) => ({
      cloudResourceId: row.cloudResourceId,
      externalResourceId: row.externalResourceId,
      displayName: typeof row.displayName === "string" ? row.displayName : null,
      resourceType: typeof row.resourceType === "string" ? row.resourceType : null,
      resourceGroup: typeof row.resourceGroup === "string" ? row.resourceGroup : null,
      region: typeof row.region === "string" ? row.region : null,
      lastSeenUtc: row.lastSeenUtc,
      workCounts: row.workCounts == null
        ? null
        : {
            openOperationalFindingsCount: finiteNonNegativeNumberOrDefault(
              row.workCounts.openOperationalFindingsCount,
              0,
            ),
            openRemediationInstancesCount: finiteNonNegativeNumberOrDefault(
              row.workCounts.openRemediationInstancesCount,
              0,
            ),
            inventoryDriftChangeCount: finiteNonNegativeNumberOrDefault(
              row.workCounts.inventoryDriftChangeCount,
              0,
            ),
          },
    }));

  return {
    items,
    totalCount: finiteNonNegativeNumberOrDefault(raw.totalCount, items.length),
    page: finiteNonNegativeNumberOrDefault(raw.page, page),
    pageSize: finiteNonNegativeNumberOrDefault(raw.pageSize, pageSize),
    hasMore: raw.hasMore === true,
  };
}

export async function fetchCloudResourceEvidenceHub(
  cloudResourceId: string,
  context: Partial<ResourceHubQueryContext>,
  page = 1,
  pageSize = 25,
): Promise<CloudResourceEvidenceHubResponse> {
  const trimmedCloudResourceId = cloudResourceId.trim();

  if (trimmedCloudResourceId.length === 0) {
    throw new Error("cloudResourceId is required.");
  }

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
      `${CLOUD_RESOURCES_PATH}/${encodeURIComponent(trimmedCloudResourceId)}/hub?${params.toString()}`,
    );

    return mapHubResponse(raw);
  } catch (error: unknown) {
    const demoFallback = tryWorkbookInfraResourceHubDemoFallback(trimmedCloudResourceId);

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
  const mapRequiredText = (value: unknown): string => typeof value === "string" ? value.trim() : "";
  const mapOptionalText = (value: unknown): string | null => {
    const mapped = mapRequiredText(value);

    return mapped.length > 0 ? mapped : null;
  };
  const mapStoredText = (value: unknown): string | null =>
    typeof value === "string" ? value.trim() : null;
  const mapStreamLabel = (value: unknown): string | null =>
    value == null ? null : mapStoredText(value);
  const mapCodeText = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";
  const mapPositivePage = (value: unknown, fallback: number): number => {
    const mapped = finiteNonNegativeNumberOrDefault(value, fallback);

    return mapped >= 1 ? mapped : fallback;
  };
  const mapFindingStream = (stream: Record<string, unknown> | undefined) => ({
    streamKind: mapRequiredText(stream?.streamKind),
    streamLabel: mapStreamLabel(stream?.streamLabel),
    items: Array.isArray(stream?.items)
      ? stream.items.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          const id = mapRequiredText(row.id);
          const title = mapRequiredText(row.title);

          if (id.length === 0 || title.length === 0) {
            return [];
          }

          return [{
            id,
            title,
            severity: mapOptionalText(row.severity),
            status: mapOptionalText(row.status),
            streamKind: mapRequiredText(row.streamKind),
            streamLabel: mapRequiredText(row.streamLabel),
          }];
        })
      : [],
    totalCount: finiteNonNegativeNumberOrDefault(stream?.totalCount, 0),
    page: mapPositivePage(stream?.page, 1),
    pageSize: mapPositivePage(stream?.pageSize, 25),
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
            || row.instanceId.trim().length === 0
            || row.patternKey.trim().length === 0
          ) {
            return [];
          }

          return [{
            instanceId: row.instanceId.trim(),
            patternKey: row.patternKey.trim(),
            status: row.status.trim(),
          }];
        })
      : [],
    totalCount: finiteNonNegativeNumberOrDefault(stream?.totalCount, 0),
    page: mapPositivePage(stream?.page, 1),
    pageSize: mapPositivePage(stream?.pageSize, 25),
    hasMore: stream?.hasMore === true,
  });

  const currentConfigurationRaw = raw.currentConfiguration as Record<string, unknown> | null | undefined;
  const diagramRaw = raw.diagramCorrespondence as Record<string, unknown> | null | undefined;
  const auditRaw = raw.auditLineageLink as Record<string, unknown> | undefined;

  return {
    cloudResourceId: mapRequiredText(raw.cloudResourceId),
    externalResourceId: mapRequiredText(raw.externalResourceId),
    resourceType: mapOptionalText(raw.resourceType),
    currentConfiguration:
      currentConfigurationRaw == null
        ? null
        : {
            snapshotId: mapRequiredText(currentConfigurationRaw.snapshotId),
            azureResourceId: mapRequiredText(currentConfigurationRaw.azureResourceId),
            resourceType: mapRequiredText(currentConfigurationRaw.resourceType),
            resourceGroup:
              typeof currentConfigurationRaw.resourceGroup === "string"
                ? currentConfigurationRaw.resourceGroup.trim()
                : null,
            region: mapOptionalText(currentConfigurationRaw.region),
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
            correspondenceId: mapRequiredText(diagramRaw.correspondenceId),
            diagramNodeId: mapOptionalText(diagramRaw.diagramNodeId),
            diagramNodeLabel: mapOptionalText(diagramRaw.diagramNodeLabel),
            cloudResourceId: mapOptionalText(diagramRaw.cloudResourceId),
            azureResourceId: mapOptionalText(diagramRaw.azureResourceId),
            resourceType: mapOptionalText(diagramRaw.resourceType),
            resourceGroup: mapOptionalText(diagramRaw.resourceGroup),
            terraformAddress: mapOptionalText(diagramRaw.terraformAddress),
            matchKind: mapCodeText(diagramRaw.matchKind),
            confidenceBand: mapCodeText(diagramRaw.confidenceBand),
            explainText: mapStoredText(diagramRaw.explainText),
            aiRationale: mapStoredText(diagramRaw.aiRationale),
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

          const principalId = mapRequiredText(row.principalId);
          const roleDefinitionId = mapRequiredText(row.roleDefinitionId);
          const scope = mapRequiredText(row.scope);

          if (principalId.length === 0 || roleDefinitionId.length === 0 || scope.length === 0) {
            return [];
          }

          return [{
            principalId,
            roleDefinitionId,
            scope,
          }];
        })
      : [],
    networkRelationships: Array.isArray(raw.networkRelationships)
      ? raw.networkRelationships.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          const relationshipType = mapRequiredText(row.relationshipType);
          const fromAzureResourceId = mapRequiredText(row.fromAzureResourceId);
          const toAzureResourceId = mapRequiredText(row.toAzureResourceId);

          if (relationshipType.length === 0 || fromAzureResourceId.length === 0 || toAzureResourceId.length === 0) {
            return [];
          }

          return [{
            relationshipType,
            fromAzureResourceId,
            toAzureResourceId,
          }];
        })
      : [],
    recentChanges: Array.isArray(raw.recentChanges)
      ? raw.recentChanges.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          const changeId = mapRequiredText(row.changeId);
          const diffId = mapRequiredText(row.diffId);
          const snapshotAId = mapRequiredText(row.snapshotAId);
          const snapshotBId = mapRequiredText(row.snapshotBId);
          const changeType = mapRequiredText(row.changeType);

          if (
            changeId.length === 0
            || diffId.length === 0
            || snapshotAId.length === 0
            || snapshotBId.length === 0
            || changeType.length === 0
          ) {
            return [];
          }

          return [{
            changeId,
            diffId,
            snapshotAId,
            snapshotBId,
            changeType,
            property: mapOptionalText(row.property),
            oldValue: mapOptionalText(row.oldValue),
            newValue: mapOptionalText(row.newValue),
            riskClassification: mapOptionalText(row.riskClassification),
          }];
        })
      : [],
    auditLineageLink: {
      available: auditRaw?.available === true,
      degradedReason: typeof auditRaw?.degradedReason === "string" ? auditRaw.degradedReason : null,
      relativePath: mapOptionalText(auditRaw?.relativePath),
      assessmentId: mapOptionalText(auditRaw?.assessmentId),
      auditEvidenceSnapshotId:
        typeof auditRaw?.auditEvidenceSnapshotId === "string" ? auditRaw.auditEvidenceSnapshotId : null,
      controlId: mapOptionalText(auditRaw?.controlId),
      controlNumber: mapOptionalText(auditRaw?.controlNumber),
      controlTitle: mapOptionalText(auditRaw?.controlTitle),
      matches: Array.isArray(auditRaw?.matches)
        ? auditRaw.matches.flatMap((item) => {
            if (item === null || typeof item !== "object" || Array.isArray(item)) {
              return [];
            }

            const row = item as Record<string, unknown>;
            const required = [
              row.assessmentId,
              row.auditEvidenceSnapshotId,
              row.controlId,
              row.controlNumber,
              row.controlTitle,
              row.snapshotCreatedUtc,
            ];

            if (!required.every((value) => typeof value === "string" && value.trim().length > 0)) {
              return [];
            }

            return [{
              assessmentId: mapRequiredText(row.assessmentId),
              auditEvidenceSnapshotId: mapRequiredText(row.auditEvidenceSnapshotId),
              controlId: mapRequiredText(row.controlId),
              controlNumber: mapRequiredText(row.controlNumber),
              controlTitle: mapRequiredText(row.controlTitle),
              snapshotCreatedUtc: mapRequiredText(row.snapshotCreatedUtc),
            }];
          })
        : [],
    },
    evidencePointers: Array.isArray(raw.evidencePointers)
      ? raw.evidencePointers.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          const kind = mapRequiredText(row.kind);
          const relativePath = mapRequiredText(row.relativePath);

          if (kind.length === 0 || relativePath.length === 0) {
            return [];
          }

          return [{ kind, relativePath }];
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
