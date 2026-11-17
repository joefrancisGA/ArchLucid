import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import {
  resolveSystemNotJobWorkingReviewArchitectureId,
  resolveSystemNotJobWorkingReviewOpenHref,
} from "@/lib/system-not-job-nested-review-job-mint";

export type ResolveEvidenceGraphReviewPackageHrefInput = {
  readonly runId: string;
  readonly pathname?: string | null;
  readonly queryArchitectureId?: string | null;
  readonly pinnedArchitectureId?: string | null;
};

/** Evidence graph scope banners and loaded experience — nested open when architecture is known. */
export function resolveEvidenceGraphReviewPackageHref(input: ResolveEvidenceGraphReviewPackageHrefInput): string {
  const runTrim = input.runId.trim();

  if (runTrim.length === 0) {
    return "/architecture/reviews";
  }

  const workingReviewArchitectureId = resolveSystemNotJobWorkingReviewArchitectureId({
    pinnedArchitectureId: input.pinnedArchitectureId ?? readCachedLastOpenArchitectureId(),
    pathname: input.pathname ?? null,
    queryArchitectureId: input.queryArchitectureId,
  });

  return resolveSystemNotJobWorkingReviewOpenHref(runTrim, workingReviewArchitectureId);
}
