import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type { RunSummary } from "@/types/authority";

export type SignedRecordsListRow = {
  readonly runId: string;
  readonly reviewTitle: string;
  readonly committedUtc: string;
  readonly manifestVersion: string;
  readonly manifestId: string | null;
  readonly reviewHref: string;
  readonly signedRecordHref: string | null;
};

export function isSignedRecordsListRowOpenable(row: SignedRecordsListRow): boolean {
  return row.signedRecordHref !== null;
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
        committedUtc: run.createdUtc,
        manifestVersion: "—",
        manifestId: hasManifestId ? goldenManifestId : null,
        reviewHref,
        signedRecordHref: hasManifestId ? signedRecordDetailPath(goldenManifestId) : null,
      };
    });
}
