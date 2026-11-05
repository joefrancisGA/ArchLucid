import type { RunSummary } from "@/types/authority";

import { resolveGovernanceScopedReviewOpenHref } from "@/lib/governance-scoped-review-open-href";

type SignedRecordsListReviewHrefRun = Pick<RunSummary, "runId" | "requestId">;

/** SY-92 — sealed-record rows open the nested review desk when parent architecture is known. */
export function resolveSignedRecordsListReviewHref(run: SignedRecordsListReviewHrefRun): string {
  return resolveGovernanceScopedReviewOpenHref({
    runId: run.runId,
    requestId: run.requestId,
  });
}
