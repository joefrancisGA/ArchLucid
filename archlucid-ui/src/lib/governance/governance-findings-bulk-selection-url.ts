import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_FINDINGS_BULK_PARAM = "bulkFindings";

export function parseGovernanceFindingsBulkSelectionFromSearch(raw: string | null | undefined): readonly string[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function governanceFindingsBulkSelectionHrefFromSearch(
  currentSearch: string,
  findingIds: readonly string[],
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const ids = findingIds.map((id) => id.trim()).filter((id) => id.length > 0);

  if (ids.length === 0) {
    params.delete(GOVERNANCE_FINDINGS_BULK_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_BULK_PARAM, ids.join(","));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function governanceAssignedToMeBulkSelectionHrefFromSearch(
  currentSearch: string,
  findingIds: readonly string[],
): string {
  return governanceFindingsBulkSelectionHrefFromSearch(
    currentSearch,
    findingIds,
    GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  );
}
