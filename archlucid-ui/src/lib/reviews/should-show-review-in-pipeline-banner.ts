import { inferNextPipelineStageName } from "@/lib/resolve-active-pipeline-stage";
import { isReviewPipelineTerminalFailure } from "@/lib/review-pipeline-terminal-state";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";

/** TB-2385: pipeline still has work when the next coarse stage is known. */
export function shouldShowReviewInPipelineBanner(
  summary: RunSummary | null,
  diagnostic?: ReviewPipelineDiagnosticContext | null,
): boolean {
  if (isReviewPipelineTerminalFailure(diagnostic)) {
    return false;
  }

  return inferNextPipelineStageName(summary) !== null;
}
