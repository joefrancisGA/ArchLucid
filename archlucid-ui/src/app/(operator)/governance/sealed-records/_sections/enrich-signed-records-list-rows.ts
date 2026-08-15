import { getManifestSummary } from "@/lib/api";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { coerceManifestSummary } from "@/lib/operator/operator-response-guards";
import { tryStaticDemoManifestSummary } from "@/lib/operator/operator-static-demo";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { ManifestSummary } from "@/types/authority";

import {
  applyManifestSummaryToSignedRecordsListRow,
  type SignedRecordsListRecordLookupFailure,
  type SignedRecordsListRow,
} from "./signed-records-list-row";

/** Caps parallel manifest lookups so a full page does not fan out N+1 HTTP calls (TB-1944). */
export const SIGNED_RECORDS_LIST_ENRICH_CONCURRENCY = 5;

async function fetchManifestSummaryForListRow(manifestId: string): Promise<{
  readonly summary: ManifestSummary | null;
  readonly failure: SignedRecordsListRecordLookupFailure | null;
}> {
  const staticSummary = tryStaticDemoManifestSummary(manifestId);

  if (staticSummary !== null) {
    return { summary: staticSummary, failure: null };
  }

  try {
    const rawSummary: unknown = await getManifestSummary(manifestId);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (!coercedSummary.ok) {
      return { summary: null, failure: "summary-unavailable" };
    }

    return { summary: coercedSummary.value, failure: null };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    if (isApiNotFoundFailure(failure)) {
      return { summary: null, failure: "not-found" };
    }

    return { summary: null, failure: "summary-unavailable" };
  }
}

async function enrichSignedRecordsListRow(row: SignedRecordsListRow): Promise<SignedRecordsListRow> {
  let manifestId = row.manifestId?.trim() ?? "";

  if (manifestId.length === 0) {
    const resolvedManifestId = await resolveGoldenManifestIdForRun(row.runId);
    manifestId = resolvedManifestId?.trim() ?? "";
  }

  if (manifestId.length === 0) {
    return {
      ...row,
      manifestId: null,
      signedRecordHref: null,
      sealIntegrity: null,
      sealSigner: null,
      sealDigestTruncated: null,
      recordLookupFailure: "pending-resolution",
    };
  }

  const { summary, failure } = await fetchManifestSummaryForListRow(manifestId);

  if (summary === null) {
    return {
      ...row,
      manifestId,
      signedRecordHref: signedRecordDetailPath(manifestId),
      recordLookupFailure: failure ?? "summary-unavailable",
    };
  }

  return applyManifestSummaryToSignedRecordsListRow(row, summary, manifestId);
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

/** Resolves manifest ids and golden manifest metadata (version, seal timestamp, integrity). */
export async function enrichSignedRecordsListRows(
  rows: readonly SignedRecordsListRow[],
): Promise<SignedRecordsListRow[]> {
  return mapWithConcurrency(rows, SIGNED_RECORDS_LIST_ENRICH_CONCURRENCY, enrichSignedRecordsListRow);
}
