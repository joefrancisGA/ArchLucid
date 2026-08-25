import type { SignedRecordsListIntegrityFilter } from "./SignedRecordsListToolbar";
import type { SignedRecordsListRow } from "./signed-records-list-row";

function rowMatchesIntegrityFilter(
  row: SignedRecordsListRow,
  integrityFilter: SignedRecordsListIntegrityFilter,
): boolean {
  if (integrityFilter === "all") {
    return true;
  }

  if (integrityFilter === "unavailable") {
    return row.recordLookupFailure !== null;
  }

  if (integrityFilter === "needs-attention") {
    return row.sealIntegrity?.kind === "needs-attention";
  }

  if (integrityFilter === "sealed") {
    return (
      row.sealIntegrity?.kind === "ready" || row.sealIntegrity?.kind === "approved-with-monitoring"
    );
  }

  const _exhaustive: never = integrityFilter;

  return _exhaustive;
}

/** Client-side filter — search + integrity apply to rows already loaded for the current cursor page. */
export function filterSignedRecordsListRows(
  rows: readonly SignedRecordsListRow[],
  searchQuery: string,
  integrityFilter: SignedRecordsListIntegrityFilter,
  scopedRunId: string | null = null,
): SignedRecordsListRow[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const scopedTrim = scopedRunId?.trim() ?? "";

  return rows.filter((row) => {
    if (scopedTrim.length > 0 && row.runId.trim() !== scopedTrim) {
      return false;
    }

    if (!rowMatchesIntegrityFilter(row, integrityFilter)) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const haystack = `${row.reviewTitle} ${row.manifestVersion}`.toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
