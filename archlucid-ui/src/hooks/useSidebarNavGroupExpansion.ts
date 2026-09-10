"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseSidebarNavExpandedGroupsFromSearch,
  sidebarNavExpandedGroupsDisclosureHrefFromSearch,
} from "@/lib/sidebar-nav/sidebar-nav-expanded-groups-disclosure-url";
import {
  readSidebarNavGroupExpansionState,
  type SidebarCollapsibleNavGroupId,
  type SidebarNavGroupExpansionState,
  writeSidebarNavGroupExpansionState,
} from "@/lib/sidebar-nav-group-expansion-storage";

function expandedGroupIdsFromState(state: SidebarNavGroupExpansionState): SidebarCollapsibleNavGroupId[] {
  return (Object.entries(state) as [SidebarCollapsibleNavGroupId, boolean][])
    .filter(([, expanded]) => expanded)
    .map(([groupId]) => groupId);
}

function applyExpandedGroupsToState(
  current: SidebarNavGroupExpansionState,
  expandedGroupIds: readonly SidebarCollapsibleNavGroupId[],
): SidebarNavGroupExpansionState {
  const expandedSet = new Set(expandedGroupIds);
  const next: SidebarNavGroupExpansionState = { ...current };

  for (const groupId of Object.keys(next) as SidebarCollapsibleNavGroupId[]) {
    next[groupId] = expandedSet.has(groupId);
  }

  return next;
}

/** Collapsible sidebar group expansion — persisted per stable group id. */
export function useSidebarNavGroupExpansion(): {
  expansion: SidebarNavGroupExpansionState;
  setGroupExpanded: (groupId: SidebarCollapsibleNavGroupId, expanded: boolean) => void;
  toggleGroupExpanded: (groupId: SidebarCollapsibleNavGroupId) => void;
} {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const sidebarNavExpandedGroupsParam = searchParams.get("sidebarNavExpandedGroups");
  const [expansion, setExpansion] = useState<SidebarNavGroupExpansionState>(() =>
    readSidebarNavGroupExpansionState(),
  );

  const syncExpandedGroupsToUrl = useCallback(
    (state: SidebarNavGroupExpansionState) => {
      router.replace(
        sidebarNavExpandedGroupsDisclosureHrefFromSearch(
          currentSearch,
          expandedGroupIdsFromState(state),
          pathname,
        ),
        { scroll: false },
      );
    },
    [currentSearch, pathname, router],
  );

  const persist = useCallback(
    (next: SidebarNavGroupExpansionState) => {
      setExpansion(next);
      writeSidebarNavGroupExpansionState(next);
      syncExpandedGroupsToUrl(next);
    },
    [syncExpandedGroupsToUrl],
  );

  useEffect(() => {
    setExpansion(readSidebarNavGroupExpansionState());
  }, []);

  useEffect(() => {
    const expandedFromUrl = parseSidebarNavExpandedGroupsFromSearch(sidebarNavExpandedGroupsParam);

    if (expandedFromUrl.length === 0) {
      return;
    }

    const next = applyExpandedGroupsToState(readSidebarNavGroupExpansionState(), expandedFromUrl);
    setExpansion(next);
    writeSidebarNavGroupExpansionState(next);
  }, [sidebarNavExpandedGroupsParam]);

  const setGroupExpanded = useCallback(
    (groupId: SidebarCollapsibleNavGroupId, expanded: boolean) => {
      const current = readSidebarNavGroupExpansionState();

      if (current[groupId] === expanded) {
        return;
      }

      persist({
        ...current,
        [groupId]: expanded,
      });
    },
    [persist],
  );

  const toggleGroupExpanded = useCallback(
    (groupId: SidebarCollapsibleNavGroupId) => {
      const current = readSidebarNavGroupExpansionState();

      persist({
        ...current,
        [groupId]: !current[groupId],
      });
    },
    [persist],
  );

  return {
    expansion,
    setGroupExpanded,
    toggleGroupExpanded,
  };
}
