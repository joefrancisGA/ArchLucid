import { inferNextPipelineStageName } from "@/lib/resolve-active-pipeline-stage";
import type { RunSummary } from "@/types/authority";

/** TB-2385: pipeline still has work when the next coarse stage is known. */
export function shouldShowReviewInPipelineBanner(summary: RunSummary | null): boolean {
  return inferNextPipelineStageName(summary) !== null;
}
