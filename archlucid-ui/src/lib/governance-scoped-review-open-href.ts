import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";

export type GovernanceScopedReviewOpenHrefInput = {
  readonly runId: string;
  readonly requestId?: string | null;
  readonly architectureId?: string | null;
};

/** Working governance surfaces: nested review desk when parent architecture is known, else desk continuity. */
export function resolveGovernanceScopedReviewOpenHref(
  input: GovernanceScopedReviewOpenHrefInput,
): string {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return resolveScopedInsightOpenReviewHrefWithDeskContinuity("", {
      architectureId: input.architectureId,
    });
  }

  const locator = resolveWorkingRunReviewLocator({
    runId,
    requestId: input.requestId,
    architectureId: input.architectureId,
  });

  if (locator.architectureId !== null) {
    return locator.href;
  }

  return resolveScopedInsightOpenReviewHrefWithDeskContinuity(runId, {
    architectureId: readCachedLastOpenArchitectureId(),
  });
}
