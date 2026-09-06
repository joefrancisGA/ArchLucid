import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { parseResourceExplorerWorkQueueFromSearch } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";
import type { InfraResourcesSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

export function buildInfraResourcesSavedViewPayload(input: {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
}): OperatorSavedViewPayload {
  const filters: InfraResourcesSavedViewFilters = {
    namePrefix: input.namePrefix,
    resourceType: input.resourceType,
    resourceGroup: input.resourceGroup,
    workQueue: input.workQueue,
  };

  return {
    filters: filters as unknown as Record<string, unknown>,
    sort: null,
    columnVisibility: null,
  };
}

export function applyInfraResourcesSavedViewFilters(
  filters: InfraResourcesSavedViewFilters,
): {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
} {
  return {
    namePrefix: filters.namePrefix?.trim() ?? "",
    resourceType: filters.resourceType?.trim() ?? "",
    resourceGroup: filters.resourceGroup?.trim() ?? "",
    workQueue: parseResourceExplorerWorkQueueFromSearch(filters.workQueue),
  };
}
