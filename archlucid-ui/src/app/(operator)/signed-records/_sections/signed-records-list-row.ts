import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
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

export function buildSignedRecordsListRowsFromRuns(runs: readonly RunSummary[]): SignedRecordsListRow[] {
  return runs
    .filter((run) => run.hasGoldenManifest === true)
    .map((run): SignedRecordsListRow => {
      const runId = run.runId.trim();
      const reviewHref = `/reviews/${encodeURIComponent(runId)}`;

      return {
        runId,
        reviewTitle: buyerFacingReviewTitleFromSummary(run),
        committedUtc: run.createdUtc,
        manifestVersion: "—",
        manifestId: null,
        reviewHref,
        signedRecordHref: null,
      };
    });
}
