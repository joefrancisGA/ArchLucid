"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import {
  useArchitectureDraftRegistryEntries,
  useArchitectureDraftRegistryHydrated,
} from "@/hooks/use-architecture-draft-registry-entries";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  ARCHITECTURES_HUB_FILTER_OPTIONS,
  architecturesHubClearSearchHrefFromSearch,
  architecturesHubFilterHrefFromSearch,
  architecturesHubSearchHrefFromSearch,
  architecturesHubSortHrefFromSearch,
  countArchitecturesHubFilterMatches,
  distinctArchitectureHubDomains,
  distinctArchitectureHubOwners,
  matchesArchitecturesHubDomainFilter,
  matchesArchitecturesHubFilter,
  matchesArchitecturesHubOwnerFilter,
  matchesArchitecturesHubSearch,
  parseArchitecturesHubFilter,
  parseArchitecturesHubSearchQuery,
  parseArchitecturesHubSort,
  type ArchitectureHubFilterId,
  type ArchitectureHubSortId,
} from "@/lib/architecture/architectures-hub-filters";
import {
  parseArchitecturesHubDomainFromSearch,
  parseArchitecturesHubOwnerFromSearch,
} from "@/lib/architecture/architectures-hub-owner-domain-url";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveContinueLastArchitectureDraftEntry } from "@/lib/architecture-draft-continue-last";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import {
  ARCHITECTURES_HUB_SORT_NAME_ASC_LABEL,
  ARCHITECTURES_HUB_SORT_NAME_DESC_LABEL,
  ARCHITECTURES_HUB_SORT_UPDATED_ASC_LABEL,
  ARCHITECTURES_HUB_SORT_UPDATED_DESC_LABEL,
} from "@/lib/architectures-hub-copy";

type ArchitectureSortId = ArchitectureHubSortId;

const SORT_OPTIONS: ReadonlyArray<{ id: ArchitectureSortId; label: string }> = [
  { id: "updated-desc", label: ARCHITECTURES_HUB_SORT_UPDATED_DESC_LABEL },
  { id: "updated-asc", label: ARCHITECTURES_HUB_SORT_UPDATED_ASC_LABEL },
  { id: "name-asc", label: ARCHITECTURES_HUB_SORT_NAME_ASC_LABEL },
  { id: "name-desc", label: ARCHITECTURES_HUB_SORT_NAME_DESC_LABEL },
];

function compareEntries(
  left: ArchitectureDraftRegistryEntry,
  right: ArchitectureDraftRegistryEntry,
  sort: ArchitectureSortId,
): number {
  if (sort === "updated-desc") {
    return right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc);
  }

  if (sort === "updated-asc") {
    return left.lastUpdatedUtc.localeCompare(right.lastUpdatedUtc);
  }

  if (sort === "name-asc") {
    return left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" });
  }

  return right.displayName.localeCompare(left.displayName, undefined, { sensitivity: "base" });
}

export type ArchitectureDraftListController = ReturnType<typeof useArchitectureDraftList>;

export function useArchitectureDraftList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlSearchQuery = parseArchitecturesHubSearchQuery(searchParams.get("q"));
  const activeFilter = parseArchitecturesHubFilter(searchParams.get("filter"));
  const activeSort = parseArchitecturesHubSort(searchParams.get("sort"));
  const activeOwner = parseArchitecturesHubOwnerFromSearch(searchParams.get("owner"));
  const activeDomain = parseArchitecturesHubDomainFromSearch(searchParams.get("domain"));

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const isHydrated = useArchitectureDraftRegistryHydrated();
  const entries = useArchitectureDraftRegistryEntries();
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const scopeRecord = useOperatorScopeRecord();
  const workspaceScopeTeaching = resolveWorkspaceScopeEmptyTeachingForHub({
    listEmpty: entries.length === 0,
    scopeRecord,
    objectPlural: "architecture drafts",
  });

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = architecturesHubSearchHrefFromSearch(searchParams.toString(), searchQuery);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [router, searchParams, searchQuery]);

  const filterCounts = useMemo(() => {
    const counts = new Map<ArchitectureHubFilterId, number>();

    for (const option of ARCHITECTURES_HUB_FILTER_OPTIONS) {
      counts.set(option.id, countArchitecturesHubFilterMatches(entries, option.id));
    }

    return counts;
  }, [entries]);

  const ownerOptions = useMemo(() => distinctArchitectureHubOwners(entries), [entries]);
  const domainOptions = useMemo(() => distinctArchitectureHubDomains(entries), [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(
        (entry) =>
          matchesArchitecturesHubSearch(entry, searchQuery) &&
          matchesArchitecturesHubFilter(entry, activeFilter) &&
          matchesArchitecturesHubOwnerFilter(entry, activeOwner) &&
          matchesArchitecturesHubDomainFilter(entry, activeDomain),
      )
      .slice()
      .sort((left, right) => compareEntries(left, right, activeSort));
  }, [activeDomain, activeFilter, activeOwner, activeSort, entries, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    router.replace(architecturesHubClearSearchHrefFromSearch(currentSearch), { scroll: false });
  }, [currentSearch, router]);

  const continueLastDraft = useMemo(() => resolveContinueLastArchitectureDraftEntry(entries), [entries]);

  return {
    buyerPolishedShell,
    isHydrated,
    entries,
    searchQuery,
    setSearchQuery,
    currentSearch,
    activeFilter,
    activeSort,
    activeOwner,
    activeDomain,
    filterCounts,
    ownerOptions,
    domainOptions,
    filteredEntries,
    clearSearch,
    continueLastDraft,
    workspaceScopeTeaching,
    sortOptions: SORT_OPTIONS,
  };
}
