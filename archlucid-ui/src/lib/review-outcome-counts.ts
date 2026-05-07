import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isStaticDemoPayloadFallbackActiveForRun } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { ManifestSummary } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

function isShowcaseSpineRun(runId: string): boolean {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return true;
  }

  return canonicalizeDemoRunId(trimmed) === SHOWCASE_STATIC_DEMO_RUN_ID;
}

/**
 * Aligns headline "findings" and manifest "warnings" counts for the static showcase when live APIs return zeros/nulls.
 */
export function resolveReviewOutcomeCounts(props: {
  readonly runId: string;
  readonly usedStaticDemoRun: boolean;
  readonly explanationSummary: RunExplanationSummary | null;
  readonly manifestSummary: ManifestSummary | null;
}): { findingCountDisplay: number | null; warningCountDisplay: number | null } {
  const spine =
    props.usedStaticDemoRun ||
    isShowcaseSpineRun(props.runId) ||
    isStaticDemoPayloadFallbackActiveForRun(props.runId);

  let findingCount: number | null = props.explanationSummary?.findingCount ?? null;

  if (spine && (findingCount === null || findingCount === 0)) {
    findingCount = SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;
  }

  let warningCount: number | null = props.manifestSummary?.warningCount ?? null;

  if (spine && manifestSummaryLooksMissingWarnings(props.manifestSummary, warningCount)) {
    warningCount = SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount;
  }

  return { findingCountDisplay: findingCount, warningCountDisplay: warningCount };
}

function manifestSummaryLooksMissingWarnings(summary: ManifestSummary | null, warningCount: number | null): boolean {
  if (summary === null) {
    return false;
  }

  if (warningCount === null) {
    return true;
  }

  return warningCount === 0 && SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount > 0;
}
