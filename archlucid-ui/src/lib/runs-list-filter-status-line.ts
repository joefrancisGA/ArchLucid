import type { RunSummary } from "@/types/authority";

export type RunsListPageFilterStatusOptions = {
  readonly buyerPolished?: boolean;
  /** When exactly one run remains after filters and it matches the full page, buyer copy can name finalized packages. */
  readonly soleVisibleRun?: RunSummary | null;
};

/** Live region copy for the reviews table: avoids awkward "Showing 1 of 1" when the page is fully visible. */
export function runsListPageFilterStatusLine(
  filteredCount: number,
  pageRunCount: number,
  filterActive: boolean,
  options?: RunsListPageFilterStatusOptions,
): string {
  const filterSuffix = filterActive ? " (matches filter)" : "";

  if (pageRunCount === 0) {
    return `No reviews on this page${filterSuffix}.`;
  }

  const sole = options?.soleVisibleRun ?? null;
  const buyer = options?.buyerPolished === true;

  if (
    buyer &&
    sole !== null &&
    filteredCount === pageRunCount &&
    filteredCount === 1
  ) {
    const finalized = sole.hasGoldenManifest === true;
    const noun = finalized ? "1 finalized review package" : "1 in-flight review";

    return `${noun} on this page${filterSuffix}.`;
  }

  if (filteredCount === pageRunCount) {
    const noun = pageRunCount === 1 ? "review" : "reviews";

    return `${pageRunCount} ${noun} on this page${filterSuffix}.`;
  }

  return `Showing ${filteredCount} of ${pageRunCount} on this page${filterSuffix}`;
}
