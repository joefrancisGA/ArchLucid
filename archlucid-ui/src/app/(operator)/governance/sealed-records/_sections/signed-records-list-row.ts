import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { ManifestSummary } from "@/types/authority";
import type { RunSummary } from "@/types/authority";

import {
  deriveSignedRecordsListSealIntegrity,
  truncateSignedRecordsListSealDigest,
  type SignedRecordsListSealIntegrityPresentation,
} from "./signed-records-list-seal-integrity";
import { SIGNED_RECORDS_LIST_VERSION_UNKNOWN } from "./signed-records-list-copy";

export type SignedRecordsListRecordLookupFailure =
  | "pending-resolution"
  | "summary-unavailable"
  | "not-found";

export type SignedRecordsListRow = {
  readonly runId: string;
  readonly reviewTitle: string;
  /** Seal timestamp from manifest `createdUtc` after enrichment — not review `createdUtc`. */
  readonly committedUtc: string;
  /** Golden manifest `ruleSetVersion` after enrichment — not `currentManifestVersion`. */
  readonly manifestVersion: string;
  readonly manifestId: string | null;
  readonly reviewHref: string;
  readonly signedRecordHref: string | null;
  readonly sealIntegrity: SignedRecordsListSealIntegrityPresentation | null;
  readonly sealSigner: string | null;
  readonly sealDigestTruncated: string | null;
  readonly recordLookupFailure: SignedRecordsListRecordLookupFailure | null;
};

export function isSignedRecordsListRowOpenable(row: SignedRecordsListRow): boolean {
  return row.signedRecordHref !== null;
}

export function applyManifestSummaryToSignedRecordsListRow(
  row: SignedRecordsListRow,
  summary: ManifestSummary,
  manifestId: string,
): SignedRecordsListRow {
  const version = summary.ruleSetVersion.trim();

  return {
    ...row,
    manifestId,
    signedRecordHref: signedRecordDetailPath(manifestId),
    committedUtc: summary.createdUtc,
    manifestVersion: version.length > 0 ? version : SIGNED_RECORDS_LIST_VERSION_UNKNOWN,
    sealIntegrity: deriveSignedRecordsListSealIntegrity(summary),
    sealSigner: null,
    sealDigestTruncated: truncateSignedRecordsListSealDigest(summary.manifestHash),
    recordLookupFailure: null,
  };
}

export function buildSignedRecordsListRowsFromRuns(runs: readonly RunSummary[]): SignedRecordsListRow[] {
  return runs
    .filter((run) => run.hasGoldenManifest === true)
    .map((run): SignedRecordsListRow => {
      const runId = run.runId.trim();
      const reviewHref = `/architecture/reviews/${encodeURIComponent(runId)}`;
      const goldenManifestId = run.goldenManifestId?.trim() ?? "";
      const hasManifestId = goldenManifestId.length > 0;

      return {
        runId,
        reviewTitle: buyerFacingReviewTitleFromSummary(run),
        committedUtc: "",
        manifestVersion: SIGNED_RECORDS_LIST_VERSION_UNKNOWN,
        manifestId: hasManifestId ? goldenManifestId : null,
        reviewHref,
        signedRecordHref: hasManifestId ? signedRecordDetailPath(goldenManifestId) : null,
        sealIntegrity: null,
        sealSigner: null,
        sealDigestTruncated: null,
        recordLookupFailure: hasManifestId ? null : "pending-resolution",
      };
    });
}
