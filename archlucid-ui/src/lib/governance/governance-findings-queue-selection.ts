import type { ReadonlyURLSearchParams } from "next/navigation";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

const FOCUSED_FINDING_PARAM = "focusedFinding";

/** Trim finding ids at bulk-selection boundaries so URL tokens match register rows. */
export function normalizeGovernanceQueueFindingId(findingId: string): string {
  return findingId.trim();
}

export function governanceFindingsQueueAvailableFindingIdSet(
  rows: readonly GovernanceFindingQueueRow[],
): ReadonlySet<string> {
  const ids = rows
    .filter((row) => row.recordKind === "finding")
    .map((row) => normalizeGovernanceQueueFindingId(row.findingId))
    .filter((id) => id.length > 0);

  return new Set(ids);
}

export function isGovernanceQueueFindingIdSelected(
  selectedFindingIds: ReadonlySet<string> | undefined,
  findingId: string,
): boolean {
  if (selectedFindingIds === undefined) {
    return false;
  }

  const normalized = normalizeGovernanceQueueFindingId(findingId);

  return normalized.length > 0 && selectedFindingIds.has(normalized);
}

export function readGovernanceQueueFocusedFindingId(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): string | null {
  const value = searchParams.get(FOCUSED_FINDING_PARAM)?.trim() ?? "";

  return value.length > 0 ? value : null;
}

export function writeGovernanceQueueFocusedFindingId(findingId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (findingId === null || findingId.trim().length === 0) {
    url.searchParams.delete(FOCUSED_FINDING_PARAM);
  }
  else {
    url.searchParams.set(FOCUSED_FINDING_PARAM, findingId);
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
