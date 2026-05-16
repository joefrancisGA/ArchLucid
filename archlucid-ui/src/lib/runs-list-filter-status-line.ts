/** Live region copy for the reviews table: avoids awkward "Showing 1 of 1" when the page is fully visible. */
export function runsListPageFilterStatusLine(
  filteredCount: number,
  pageRunCount: number,
  filterActive: boolean,
): string {
  const filterSuffix = filterActive ? " (matches filter)" : "";

  if (pageRunCount === 0) {
    return `No reviews on this page${filterSuffix}.`;
  }

  if (filteredCount === pageRunCount) {
    const noun = pageRunCount === 1 ? "review" : "reviews";

    return `${pageRunCount} ${noun} on this page${filterSuffix}.`;
  }

  return `Showing ${filteredCount} of ${pageRunCount} on this page${filterSuffix}`;
}
