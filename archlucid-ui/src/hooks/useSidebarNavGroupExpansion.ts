"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readSidebarNavGroupExpansionState,
  type SidebarCollapsibleNavGroupId,
  type SidebarNavGroupExpansionState,
  writeSidebarNavGroupExpansionState,
} from "@/lib/sidebar-nav-group-expansion-storage";

/** Collapsible sidebar group expansion — persisted per stable group id. */
export function useSidebarNavGroupExpansion(): {
  expansion: SidebarNavGroupExpansionState;
  setGroupExpanded: (groupId: SidebarCollapsibleNavGroupId, expanded: boolean) => void;
  toggleGroupExpanded: (groupId: SidebarCollapsibleNavGroupId) => void;
} {
  const [expansion, setExpansion] = useState<SidebarNavGroupExpansionState>(() =>
    readSidebarNavGroupExpansionState(),
  );

  useEffect(() => {
    setExpansion(readSidebarNavGroupExpansionState());
  }, []);

  const persist = useCallback((next: SidebarNavGroupExpansionState) => {
    setExpansion(next);
    writeSidebarNavGroupExpansionState(next);
  }, []);

  const setGroupExpanded = useCallback(
    (groupId: SidebarCollapsibleNavGroupId, expanded: boolean) => {
      persist({
        ...readSidebarNavGroupExpansionState(),
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
