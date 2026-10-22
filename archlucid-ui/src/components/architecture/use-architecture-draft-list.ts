"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { useArchitectureIdentitiesListQuery } from "@/hooks/use-architecture-identities-list-query";
import {
  selectArchitectureDraftRegistryEntries,
  useArchitectureDraftListQuery,
} from "@/hooks/use-architecture-draft-list-query";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { filterDraftRegistryEntriesByShareVisibility } from "@/lib/architecture/share-visible-architecture-inventory";
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
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
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
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlSearchQuery = parseArchitecturesHubSearchQuery(searchParams.get("q"));
  const activeFilter = parseArchitecturesHubFilter(searchParams.get("filter"));
  const activeSort = parseArchitecturesHubSort(searchParams.get("sort"));
  const activeOwner = parseArchitecturesHubOwnerFromSearch(searchParams.get("owner"));
  const activeDomain = parseArchitecturesHubDomainFromSearch(searchParams.get("domain"));

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const draftListQuery = useArchitectureDraftListQuery();
  const shareVisibleIdentitiesQuery = useArchitectureIdentitiesListQuery(1, 200);
  const isHydrated = draftListQuery.isFetched;
  const rawEntries = selectArchitectureDraftRegistryEntries(draftListQuery);
  const entries = useMemo((): readonly ArchitectureDraftRegistryEntry[] => {
    if (!shareVisibleIdentitiesQuery.isFetched || shareVisibleIdentitiesQuery.data === undefined) {
      return rawEntries;
    }

    return filterDraftRegistryEntriesByShareVisibility(
      rawEntries,
      shareVisibleIdentitiesQuery.data.items,
    );
  }, [rawEntries, shareVisibleIdentitiesQuery.data, shareVisibleIdentitiesQuery.isFetched]);
  const [searchQuery, setSearchQueryState] = useState(urlSearchQuery);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const scopeRecord = useOperatorScopeRecord();
  const workspaceScopeTeaching = resolveWorkspaceScopeEmptyTeachingForHub({
    listEmpty: entries.length === 0,
    scopeRecord,
    objectPlural: "architecture drafts",
  });

  useEffect(() => {
    const syncSearchQueryFromUrl = (): void => {
      const next = parseArchitecturesHubSearchQuery(new URLSearchParams(window.location.search).get("q"));

      if (searchQueryRef.current === next) {
        return;
      }

      searchQueryRef.current = next;
      setSearchQueryState(next);
    };

    syncSearchQueryFromUrl();
    window.addEventListener("popstate", syncSearchQueryFromUrl);

    return () => {
      window.removeEventListener("popstate", syncSearchQueryFromUrl);
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      commitHrefIfChanged(architecturesHubSearchHrefFromSearch(readWindowLocationSearch(), searchQuery), {
        notify: false,
      });
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchQuery]);

  const setSearchQuery = useCallback((value: string) => {
    searchQueryRef.current = value;
    setSearchQueryState(value);
  }, []);

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
    searchQueryRef.current = "";
    setSearchQueryState("");
    commitHrefIfChanged(architecturesHubClearSearchHrefFromSearch(readWindowLocationSearch()), {
      notify: false,
    });
  }, []);

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
    listBlockedReason: draftListQuery.blockedReason,
    listFailure: draftListQuery.failure,
  };
}
