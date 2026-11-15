import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import {
  formatAzureResourceTypeForDisplay,
  formatCloudResourceDisplayName,
} from "@/lib/infra-evidence/format-azure-resource-display";
import type { CloudResourceSummary } from "@/lib/infra-evidence/infra-evidence-hub-types";

export type ResourcesExplorerTableSortKey =
  | "name"
  | "work"
  | "type"
  | "resourceGroup"
  | "region"
  | "lastSeen";

export const RESOURCES_EXPLORER_DEFAULT_SORT_KEY: ResourcesExplorerTableSortKey = "name";

export const RESOURCES_EXPLORER_DEFAULT_SORT_ASC = true;

function totalWorkCount(row: CloudResourceSummary): number {
  const workCounts = row.workCounts;

  if (workCounts == null) {
    return 0;
  }

  return (
    (workCounts.openOperationalFindingsCount ?? 0)
    + (workCounts.openRemediationInstancesCount ?? 0)
    + (workCounts.inventoryDriftChangeCount ?? 0)
  );
}

function lastSeenSortTime(lastSeenUtc: string): number {
  const parsed = parseIsoUtcMs(lastSeenUtc);

  return Number.isNaN(parsed) ? Number.MIN_SAFE_INTEGER : parsed;
}

function compareResourceExplorerRows(
  left: CloudResourceSummary,
  right: CloudResourceSummary,
  sortKey: ResourcesExplorerTableSortKey,
): number {
  if (sortKey === "name") {
    return formatCloudResourceDisplayName(left).localeCompare(formatCloudResourceDisplayName(right));
  }

  if (sortKey === "work") {
    return totalWorkCount(left) - totalWorkCount(right);
  }

  if (sortKey === "type") {
    const leftType = formatAzureResourceTypeForDisplay(left.resourceType);
    const rightType = formatAzureResourceTypeForDisplay(right.resourceType);

    return leftType.localeCompare(rightType);
  }

  if (sortKey === "resourceGroup") {
    return (left.resourceGroup ?? "").localeCompare(right.resourceGroup ?? "");
  }

  if (sortKey === "region") {
    return (left.region ?? "").localeCompare(right.region ?? "");
  }

  return lastSeenSortTime(left.lastSeenUtc) - lastSeenSortTime(right.lastSeenUtc);
}

export function sortResourceExplorerRows(
  rows: readonly CloudResourceSummary[],
  sortKey: ResourcesExplorerTableSortKey,
  sortAsc: boolean,
): CloudResourceSummary[] {
  const copy = [...rows];

  copy.sort((left, right) => {
    const result = compareResourceExplorerRows(left, right, sortKey);

    return sortAsc ? result : -result;
  });

  return copy;
}

export function resourcesExplorerTableSortDirection(
  columnKey: ResourcesExplorerTableSortKey,
  activeSortKey: ResourcesExplorerTableSortKey,
  sortAsc: boolean,
): "ascending" | "descending" | "none" {
  if (columnKey !== activeSortKey) {
    return "none";
  }

  return sortAsc ? "ascending" : "descending";
}
