import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";
import type { RunSummary } from "@/types/authority";

type SignedRecordsListReviewHrefRun = Pick<RunSummary, "runId" | "requestId">;

/** SY-92 — sealed-record rows open the nested review desk when parent architecture is known. */
export function resolveSignedRecordsListReviewHref(run: SignedRecordsListReviewHrefRun): string {
  const locator = resolveWorkingRunReviewLocator({
    runId: run.runId,
    requestId: run.requestId,
  });

  if (locator.architectureId !== null) {
    return locator.href;
  }

  return resolveScopedInsightOpenReviewHrefWithDeskContinuity(run.runId, {
    architectureId: readCachedLastOpenArchitectureId(),
  });
}
