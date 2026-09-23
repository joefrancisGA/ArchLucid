"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
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
  const pathname = usePathname() ?? "/";
  const pathnameRef = useRef(pathname);
  const suppressUrlSyncRef = useRef(false);

  pathnameRef.current = pathname;

  const [expansion, setExpansion] = useState<SidebarNavGroupExpansionState>(() =>
    readSidebarNavGroupExpansionState(),
  );

  const syncExpandedGroupsToUrl = useCallback((state: SidebarNavGroupExpansionState) => {
    suppressUrlSyncRef.current = true;
    commitHrefIfChanged(
      sidebarNavExpandedGroupsDisclosureHrefFromSearch(
        window.location.search.slice(1),
        expandedGroupIdsFromState(state),
        pathnameRef.current,
      ),
      { notify: true },
    );
  }, []);

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
    const syncExpandedGroupsFromUrl = (): void => {
      if (suppressUrlSyncRef.current) {
        suppressUrlSyncRef.current = false;

        return;
      }

      const expandedFromUrl = parseSidebarNavExpandedGroupsFromSearch(
        new URLSearchParams(window.location.search).get("sidebarNavExpandedGroups"),
      );

      if (expandedFromUrl.length === 0) {
        return;
      }

      const next = applyExpandedGroupsToState(readSidebarNavGroupExpansionState(), expandedFromUrl);
      setExpansion(next);
      writeSidebarNavGroupExpansionState(next);
    };

    syncExpandedGroupsFromUrl();
    window.addEventListener("popstate", syncExpandedGroupsFromUrl);

    return () => {
      window.removeEventListener("popstate", syncExpandedGroupsFromUrl);
    };
  }, []);

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
