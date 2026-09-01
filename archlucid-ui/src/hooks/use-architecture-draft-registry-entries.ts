"use client";

import {
  useArchitectureDraftListQuery,
  selectArchitectureDraftRegistryEntries,
} from "@/hooks/use-architecture-draft-list-query";

/** Server-backed architecture draft inventory for hub, home, and workspace chrome. */
export function useArchitectureDraftRegistryEntries() {
  const query = useArchitectureDraftListQuery();

  return selectArchitectureDraftRegistryEntries(query);
}

/** True once the server-backed draft list has settled (success or error). */
export function useArchitectureDraftRegistryHydrated(): boolean {
  const query = useArchitectureDraftListQuery();

  return query.isFetched;
}
