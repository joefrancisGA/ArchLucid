import type { CompareFindingLifecycleState } from "@/lib/compare-finding-lifecycle";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const COMPARE_FINDING_LIFECYCLE_STATUS_PARAM = "comparisonStatus";

export const COMPARE_FINDING_LIFECYCLE_STATUS_OPTIONS: readonly CompareFindingLifecycleState[] = [
  "NewlyIdentified",
  "PreviouslyIdentifiedStillPresent",
  "CandidateResolved",
];

const COMPARE_FINDING_LIFECYCLE_STATUS_IDS = new Set<string>(COMPARE_FINDING_LIFECYCLE_STATUS_OPTIONS);

export function parseCompareFindingLifecycleStatusFromSearch(
  raw: string | null | undefined,
): CompareFindingLifecycleState | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!COMPARE_FINDING_LIFECYCLE_STATUS_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as CompareFindingLifecycleState;
}

export function compareFindingLifecycleStatusHrefFromSearch(
  currentSearch: string,
  status: CompareFindingLifecycleState | null,
  pathname: string = COMPARE_TWO_REVIEWS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (status === null) {
      params.delete(COMPARE_FINDING_LIFECYCLE_STATUS_PARAM);
    } else {
      params.set(COMPARE_FINDING_LIFECYCLE_STATUS_PARAM, status);
    }
    },
  });
}
