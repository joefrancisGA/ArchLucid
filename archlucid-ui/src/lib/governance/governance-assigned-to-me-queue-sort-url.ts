import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import type { GovernanceAssignedToMeQueueSortKey } from "@/lib/governance/governance-assigned-to-me-queue-sort";

export const GOVERNANCE_ASSIGNED_TO_ME_SORT_PARAM = "sort";
export const GOVERNANCE_ASSIGNED_TO_ME_SORT_DIR_PARAM = "dir";

const SORT_KEY_IDS = new Set<string>(["severity", "due", "title", "sourceReview"]);
const SORT_DIR_IDS = new Set<string>(["asc", "desc"]);

export const DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_KEY: GovernanceAssignedToMeQueueSortKey = "severity";
export const DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_ASC = true;

export function parseGovernanceAssignedToMeSortKeyFromSearch(
  raw: string | null | undefined,
): GovernanceAssignedToMeQueueSortKey {
  if (raw === null || raw === undefined) {
    return DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_KEY;
  }

  const trimmed = raw.trim();

  if (!SORT_KEY_IDS.has(trimmed)) {
    return DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_KEY;
  }

  return trimmed as GovernanceAssignedToMeQueueSortKey;
}

export function parseGovernanceAssignedToMeSortAscFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_ASC;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SORT_DIR_IDS.has(trimmed)) {
    return DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_ASC;
  }

  return trimmed === "asc";
}

export function governanceAssignedToMeSortHrefFromSearch(
  currentSearch: string,
  sortKey: GovernanceAssignedToMeQueueSortKey,
  sortAsc: boolean,
  pathname: string = GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sortKey === DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_KEY) {
    params.delete(GOVERNANCE_ASSIGNED_TO_ME_SORT_PARAM);
  } else {
    params.set(GOVERNANCE_ASSIGNED_TO_ME_SORT_PARAM, sortKey);
  }

  if (sortAsc === DEFAULT_GOVERNANCE_ASSIGNED_TO_ME_SORT_ASC) {
    params.delete(GOVERNANCE_ASSIGNED_TO_ME_SORT_DIR_PARAM);
  } else {
    params.set(GOVERNANCE_ASSIGNED_TO_ME_SORT_DIR_PARAM, sortAsc ? "asc" : "desc");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
