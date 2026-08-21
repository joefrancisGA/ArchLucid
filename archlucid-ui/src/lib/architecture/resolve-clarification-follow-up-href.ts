import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { buildCreateHomeReviewTabHref } from "@/lib/unified-review-workspace-tabs";

export type ClarificationFollowUpHrefInput = {
  readonly runId: string;
  readonly correctionHref: string;
  readonly clarificationRoundAvailable: boolean;
  readonly priorRunId: string | null;
};

export function resolveClarificationFollowUpHref(input: ClarificationFollowUpHrefInput): string {
  if (input.clarificationRoundAvailable) {
    return input.correctionHref;
  }

  if (input.priorRunId !== null && input.priorRunId.trim().length > 0) {
    return comparePageHrefAdaptive(input.priorRunId.trim(), input.runId.trim());
  }

  return buildCreateHomeReviewTabHref(input.runId, "evidence");
}
