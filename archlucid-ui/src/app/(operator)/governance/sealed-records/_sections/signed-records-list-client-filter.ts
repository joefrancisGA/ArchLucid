import type { SignedRecordsListDateRangePreset } from "@/lib/signed-records/signed-records-list-date-range-url";

import type { SignedRecordsListIntegrityFilter } from "./SignedRecordsListToolbar";
import type { SignedRecordsListRow } from "./signed-records-list-row";

function rowMatchesDateRange(
  row: SignedRecordsListRow,
  dateRangePreset: SignedRecordsListDateRangePreset | null,
  customFromUtc: string,
  customToUtc: string,
): boolean {
  const from = customFromUtc.trim();
  const to = customToUtc.trim();

  if (from.length > 0 || to.length > 0) {
    const committedMs = Date.parse(row.committedUtc);

    if (Number.isNaN(committedMs)) {
      return false;
    }

    if (from.length > 0) {
      const fromMs = Date.parse(`${from}T00:00:00.000Z`);

      if (!Number.isNaN(fromMs) && committedMs < fromMs) {
        return false;
      }
    }

    if (to.length > 0) {
      const toMs = Date.parse(`${to}T23:59:59.999Z`);

      if (!Number.isNaN(toMs) && committedMs > toMs) {
        return false;
      }
    }

    return true;
  }

  if (dateRangePreset === null) {
    return true;
  }

  const committedMs = Date.parse(row.committedUtc);

  if (Number.isNaN(committedMs)) {
    return false;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const windowDays = dateRangePreset === "7d" ? 7 : 30;
  const cutoffMs = Date.now() - windowDays * dayMs;

  return committedMs >= cutoffMs;
}

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
  dateRangePreset: SignedRecordsListDateRangePreset | null = null,
  customFromUtc: string = "",
  customToUtc: string = "",
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

    if (!rowMatchesDateRange(row, dateRangePreset, customFromUtc, customToUtc)) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const haystack = `${row.reviewTitle} ${row.manifestVersion}`.toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
