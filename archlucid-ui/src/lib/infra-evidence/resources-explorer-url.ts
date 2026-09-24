import {
  RESOURCES_EXPLORER_DEFAULT_SORT_ASC,
  RESOURCES_EXPLORER_DEFAULT_SORT_KEY,
  type ResourcesExplorerTableSortKey,
} from "@/lib/infra-evidence/resources-explorer-table-sort";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { resolveProductLineId } from "@/lib/product-line/resolve-product-line-id";

export const RESOURCE_EXPLORER_PAGE_PARAM = "page";
export const RESOURCE_EXPLORER_SORT_PARAM = "sort";
export const RESOURCE_EXPLORER_SORT_DIR_PARAM = "dir";

const SORT_KEY_IDS = new Set<string>([
  "name",
  "work",
  "type",
  "resourceGroup",
  "region",
  "lastSeen",
]);

const SORT_DIR_IDS = new Set<string>(["asc", "desc"]);

export function parseResourceExplorerPageFromSearch(raw: string | null | undefined): number {
  if (raw === null || raw === undefined) {
    return 1;
  }

  const trimmed = raw.trim();

  if (!/^\d+$/.test(trimmed)) {
    return 1;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function parseResourcesExplorerSortKeyFromSearch(
  raw: string | null | undefined,
): ResourcesExplorerTableSortKey {
  if (raw === null || raw === undefined) {
    return RESOURCES_EXPLORER_DEFAULT_SORT_KEY;
  }

  const trimmed = raw.trim();

  if (!SORT_KEY_IDS.has(trimmed)) {
    return RESOURCES_EXPLORER_DEFAULT_SORT_KEY;
  }

  return trimmed as ResourcesExplorerTableSortKey;
}

export function parseResourcesExplorerSortAscFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return RESOURCES_EXPLORER_DEFAULT_SORT_ASC;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SORT_DIR_IDS.has(trimmed)) {
    return RESOURCES_EXPLORER_DEFAULT_SORT_ASC;
  }

  return trimmed === "asc";
}

export function encodeResourcesExplorerSavedViewSort(
  sortKey: ResourcesExplorerTableSortKey,
  sortAsc: boolean,
): string | null {
  if (sortKey === RESOURCES_EXPLORER_DEFAULT_SORT_KEY && sortAsc === RESOURCES_EXPLORER_DEFAULT_SORT_ASC) {
    return null;
  }

  return `${sortKey}:${sortAsc ? "asc" : "desc"}`;
}

export function parseResourcesExplorerSavedViewSort(
  raw: string | null | undefined,
): { readonly sortKey: ResourcesExplorerTableSortKey; readonly sortAsc: boolean } {
  if (raw == null || raw.trim().length === 0) {
    return {
      sortKey: RESOURCES_EXPLORER_DEFAULT_SORT_KEY,
      sortAsc: RESOURCES_EXPLORER_DEFAULT_SORT_ASC,
    };
  }

  const [sortKeyRaw, sortDirRaw] = raw.split(":");

  return {
    sortKey: parseResourcesExplorerSortKeyFromSearch(sortKeyRaw),
    sortAsc: parseResourcesExplorerSortAscFromSearch(sortDirRaw),
  };
}

export function resourceExplorerListStateHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly page?: number;
    readonly sortKey?: ResourcesExplorerTableSortKey;
    readonly sortAsc?: boolean;
  },
  pathname: string = infrastructureResourcesPathForProductLine(resolveProductLineId()),
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.page !== undefined) {
    if (patch.page <= 1) {
      params.delete(RESOURCE_EXPLORER_PAGE_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_PAGE_PARAM, String(patch.page));
    }
  }

  if (patch.sortKey !== undefined) {
    if (patch.sortKey === RESOURCES_EXPLORER_DEFAULT_SORT_KEY) {
      params.delete(RESOURCE_EXPLORER_SORT_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_SORT_PARAM, patch.sortKey);
    }
  }

  if (patch.sortAsc !== undefined) {
    if (patch.sortAsc === RESOURCES_EXPLORER_DEFAULT_SORT_ASC) {
      params.delete(RESOURCE_EXPLORER_SORT_DIR_PARAM);
    } else {
      params.set(RESOURCE_EXPLORER_SORT_DIR_PARAM, patch.sortAsc ? "asc" : "desc");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function formatResourcesExplorerPageRangeLabel(input: {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
}): string {
  if (input.totalCount <= 0) {
    return "Showing 0 of 0";
  }

  const rangeStart = (input.page - 1) * input.pageSize + 1;
  const rangeEnd = Math.min(input.page * input.pageSize, input.totalCount);

  return `Showing ${rangeStart}–${rangeEnd} of ${input.totalCount}`;
}
