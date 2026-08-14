import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import type { SignedRecordsListRow } from "./signed-records-list-row";

/** Caps parallel manifest lookups so a full page does not fan out N+1 HTTP calls (TB-1944). */
export const SIGNED_RECORDS_LIST_ENRICH_CONCURRENCY = 5;

async function enrichSignedRecordsListRow(row: SignedRecordsListRow): Promise<SignedRecordsListRow> {
  const existingManifestId = row.manifestId?.trim() ?? "";

  if (existingManifestId.length > 0) {
    return row;
  }

  const manifestId = await resolveGoldenManifestIdForRun(row.runId);

  if (manifestId === null || manifestId.length === 0) {
    return row;
  }

  return {
    ...row,
    manifestId,
    signedRecordHref: signedRecordDetailPath(manifestId),
  };
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

/** Resolves missing manifest ids for signed-record list rows (list payload already carries version). */
export async function enrichSignedRecordsListRows(
  rows: readonly SignedRecordsListRow[],
): Promise<SignedRecordsListRow[]> {
  return mapWithConcurrency(rows, SIGNED_RECORDS_LIST_ENRICH_CONCURRENCY, enrichSignedRecordsListRow);
}
