import type { SecurityDeclaredConnectionRow } from "@/lib/security-declared-connection-types";

import { resolveDeclaredConnectionDisplayStatus } from "./declared-connections-status";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export type DeclaredConnectionsStatusFilter = "all" | "Active" | "NearExpiry" | "Expired" | "Revoked";

export const DECLARED_CONNECTIONS_STATUS_FILTER_PARAM = "status" as const;

export function parseDeclaredConnectionsStatusFilter(raw: string | null | undefined): DeclaredConnectionsStatusFilter {
  const trimmed = raw?.trim() ?? "";

  if (
    trimmed === "Active"
    || trimmed === "NearExpiry"
    || trimmed === "Expired"
    || trimmed === "Revoked"
  ) {
    return trimmed;
  }

  return "all";
}

export function filterDeclaredConnectionsByStatus(
  rows: readonly SecurityDeclaredConnectionRow[],
  filter: DeclaredConnectionsStatusFilter,
): SecurityDeclaredConnectionRow[] {
  if (filter === "all") {
    return [...rows];
  }

  return rows.filter((row) => resolveDeclaredConnectionDisplayStatus(row) === filter);
}

export function countDeclaredConnectionsByStatus(
  rows: readonly SecurityDeclaredConnectionRow[],
): Record<DeclaredConnectionsStatusFilter, number> {
  const counts: Record<DeclaredConnectionsStatusFilter, number> = {
    all: rows.length,
    Active: 0,
    NearExpiry: 0,
    Expired: 0,
    Revoked: 0,
  };

  for (const row of rows) {
    const displayStatus = resolveDeclaredConnectionDisplayStatus(row);

    counts[displayStatus] += 1;
  }

  return counts;
}

export function declaredConnectionsFilterHrefFromSearch(
  currentSearch: string,
  filter: DeclaredConnectionsStatusFilter,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (filter === "all") {
      params.delete(DECLARED_CONNECTIONS_STATUS_FILTER_PARAM);
    } else {
      params.set(DECLARED_CONNECTIONS_STATUS_FILTER_PARAM, filter);
    }
    },
  });
}
