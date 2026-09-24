import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { parseResourceExplorerWorkQueueFromSearch } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import {
  encodeResourcesExplorerSavedViewSort,
  parseResourcesExplorerSavedViewSort,
} from "@/lib/infra-evidence/resources-explorer-url";
import type {
  ResourcesExplorerTableSortKey,
} from "@/lib/infra-evidence/resources-explorer-table-sort";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";
import type { InfraResourcesSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

export function buildInfraResourcesSavedViewPayload(input: {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
  readonly sortKey?: ResourcesExplorerTableSortKey;
  readonly sortAsc?: boolean;
}): OperatorSavedViewPayload {
  const filters: InfraResourcesSavedViewFilters = {
    namePrefix: input.namePrefix,
    resourceType: input.resourceType,
    resourceGroup: input.resourceGroup,
    workQueue: input.workQueue,
  };

  const sort = input.sortKey == null || input.sortAsc == null
    ? null
    : encodeResourcesExplorerSavedViewSort(input.sortKey, input.sortAsc);

  return {
    filters: filters as unknown as Record<string, unknown>,
    sort,
    columnVisibility: null,
  };
}

export function applyInfraResourcesSavedViewFilters(
  filters: InfraResourcesSavedViewFilters,
  sort: string | null | undefined = null,
): {
  readonly namePrefix: string;
  readonly resourceType: string;
  readonly resourceGroup: string;
  readonly workQueue: CloudResourceExplorerWorkQueue;
  readonly sortKey: ResourcesExplorerTableSortKey;
  readonly sortAsc: boolean;
} {
  const parsedSort = parseResourcesExplorerSavedViewSort(sort);

  return {
    namePrefix: filters.namePrefix?.trim() ?? "",
    resourceType: filters.resourceType?.trim() ?? "",
    resourceGroup: filters.resourceGroup?.trim() ?? "",
    workQueue: parseResourceExplorerWorkQueueFromSearch(filters.workQueue),
    sortKey: parsedSort.sortKey,
    sortAsc: parsedSort.sortAsc,
  };
}
