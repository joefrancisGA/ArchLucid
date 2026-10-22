import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import type { RunSummary } from "@/types/authority";

type SignedRecordsListReviewHrefRun = Pick<RunSummary, "runId" | "requestId">;

/** SY-92 — sealed-record rows open the nested review desk when parent architecture is known. */
export function resolveSignedRecordsListReviewHref(run: SignedRecordsListReviewHrefRun): string {
  return resolveWorkingRunReviewLocator({
    runId: run.runId,
    requestId: run.requestId,
  }).href;
}
