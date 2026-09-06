import type { ArchitectureDraftCustomerStatus } from "@/lib/architecture/architecture-draft-status";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURES_HUB_FILTER_ALL_LABEL,
  ARCHITECTURES_HUB_FILTER_ARCHIVED_LABEL,
  ARCHITECTURES_HUB_FILTER_DRAFT_LABEL,
  ARCHITECTURES_HUB_FILTER_NO_REVIEW_LABEL,
  ARCHITECTURES_HUB_FILTER_READY_LABEL,
} from "@/lib/architectures-hub-copy";

export type ArchitectureHubFilterId =
  | "all"
  | ArchitectureDraftCustomerStatus
  | "no-review";

export const ARCHITECTURES_HUB_FILTER_OPTIONS: ReadonlyArray<{ id: ArchitectureHubFilterId; label: string }> = [
  { id: "all", label: ARCHITECTURES_HUB_FILTER_ALL_LABEL },
  { id: "draft", label: ARCHITECTURES_HUB_FILTER_DRAFT_LABEL },
  { id: "ready-for-review", label: ARCHITECTURES_HUB_FILTER_READY_LABEL },
  { id: "no-review", label: ARCHITECTURES_HUB_FILTER_NO_REVIEW_LABEL },
  { id: "archived", label: ARCHITECTURES_HUB_FILTER_ARCHIVED_LABEL },
];

const ARCHITECTURES_HUB_FILTER_IDS = new Set<string>(
  ARCHITECTURES_HUB_FILTER_OPTIONS.map((option) => option.id),
);

export const ARCHITECTURES_HUB_SEARCH_PARAM = "q";
export const ARCHITECTURES_HUB_FILTER_PARAM = "filter";
export const ARCHITECTURES_HUB_SORT_PARAM = "sort";

export type ArchitectureHubSortId = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

const ARCHITECTURES_HUB_SORT_IDS = new Set<string>([
  "updated-desc",
  "updated-asc",
  "name-asc",
  "name-desc",
]);

export const DEFAULT_ARCHITECTURES_HUB_SORT: ArchitectureHubSortId = "updated-desc";

/** Parses `?filter=` from the architectures hub URL; unknown values fall back to All. */
export function parseArchitecturesHubFilter(raw: string | null | undefined): ArchitectureHubFilterId {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!ARCHITECTURES_HUB_FILTER_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as ArchitectureHubFilterId;
}

/** Parses `?sort=` from the architectures hub URL; unknown values fall back to updated-desc. */
export function parseArchitecturesHubSort(raw: string | null | undefined): ArchitectureHubSortId {
  if (raw === null || raw === undefined) {
    return DEFAULT_ARCHITECTURES_HUB_SORT;
  }

  const trimmed = raw.trim();

  if (!ARCHITECTURES_HUB_SORT_IDS.has(trimmed)) {
    return DEFAULT_ARCHITECTURES_HUB_SORT;
  }

  return trimmed as ArchitectureHubSortId;
}

/** Parses `?q=` from the architectures hub URL. */
export function parseArchitecturesHubSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function architecturesHubFilterHrefFromSearch(
  currentSearch: string,
  filter: ArchitectureHubFilterId,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (filter === "all") {
    params.delete(ARCHITECTURES_HUB_FILTER_PARAM);
  } else {
    params.set(ARCHITECTURES_HUB_FILTER_PARAM, filter);
  }

  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

export function architecturesHubSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(ARCHITECTURES_HUB_SEARCH_PARAM);
  } else {
    params.set(ARCHITECTURES_HUB_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function architecturesHubClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  return architecturesHubSearchHrefFromSearch(currentSearch, "", pathname);
}

export function architecturesHubSortHrefFromSearch(
  currentSearch: string,
  sort: ArchitectureHubSortId,
  pathname: string = ARCHITECTURES_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sort === DEFAULT_ARCHITECTURES_HUB_SORT) {
    params.delete(ARCHITECTURES_HUB_SORT_PARAM);
  } else {
    params.set(ARCHITECTURES_HUB_SORT_PARAM, sort);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function architecturesHubFilterEmptyReason(filter: ArchitectureHubFilterId): string {
  const option = ARCHITECTURES_HUB_FILTER_OPTIONS.find((entry) => entry.id === filter);

  return `No architecture drafts match ${option?.label ?? filter}.`;
}

export function matchesArchitecturesHubSearch(entry: ArchitectureDraftRegistryEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const haystack = [entry.displayName, entry.ownerLabel, entry.draftId].join(" ").toLowerCase();

  return haystack.includes(normalized);
}

export function matchesArchitecturesHubFilter(
  entry: ArchitectureDraftRegistryEntry,
  filter: ArchitectureHubFilterId,
): boolean {
  if (filter === "all") {
    return entry.customerStatus !== "archived";
  }

  if (filter === "no-review") {
    return entry.linkedReviewId === null && entry.customerStatus !== "archived";
  }

  return entry.customerStatus === filter;
}

export function countArchitecturesHubFilterMatches(
  entries: readonly ArchitectureDraftRegistryEntry[],
  filter: ArchitectureHubFilterId,
): number {
  return entries.filter((entry) => matchesArchitecturesHubFilter(entry, filter)).length;
}

/** Derives an email-domain bucket from `ownerLabel` when present; otherwise returns empty. */
export function architectureDraftOwnerDomainFromOwnerLabel(ownerLabel: string): string {
  const trimmed = ownerLabel.trim();
  const atIndex = trimmed.indexOf("@");

  if (atIndex <= 0 || atIndex >= trimmed.length - 1) {
    return "";
  }

  return trimmed.slice(atIndex + 1).toLowerCase();
}

export function matchesArchitecturesHubOwnerFilter(
  entry: ArchitectureDraftRegistryEntry,
  ownerFilter: string,
): boolean {
  const needle = ownerFilter.trim().toLowerCase();

  if (needle.length === 0) {
    return true;
  }

  return entry.ownerLabel.trim().toLowerCase() === needle;
}

export function matchesArchitecturesHubDomainFilter(
  entry: ArchitectureDraftRegistryEntry,
  domainFilter: string,
): boolean {
  const needle = domainFilter.trim().toLowerCase();

  if (needle.length === 0) {
    return true;
  }

  const domain = architectureDraftOwnerDomainFromOwnerLabel(entry.ownerLabel);

  return domain.length > 0 && domain === needle;
}

export function distinctArchitectureHubOwners(entries: readonly ArchitectureDraftRegistryEntry[]): string[] {
  const owners = new Set<string>();

  for (const entry of entries) {
    const owner = entry.ownerLabel.trim();

    if (owner.length > 0) {
      owners.add(owner);
    }
  }

  return [...owners].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

export function distinctArchitectureHubDomains(entries: readonly ArchitectureDraftRegistryEntry[]): string[] {
  const domains = new Set<string>();

  for (const entry of entries) {
    const domain = architectureDraftOwnerDomainFromOwnerLabel(entry.ownerLabel);

    if (domain.length > 0) {
      domains.add(domain);
    }
  }

  return [...domains].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}
