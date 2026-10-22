import {
  canonicalizeDemoRunId,
  isShowcaseCreatedStaticDemoRunId,
  isShowcaseStaticDemoRunId,
  SHOWCASE_DEMO_RUN_SLUG_KEYS,
} from "@/lib/demo-run-canonical";
import type { RunSummary } from "@/types/authority";

type SampleReviewRunFields = Pick<RunSummary, "runId" | "isSample" | "isDemoWelcomeRun">;

/** True when a run row is seeded showcase, demo-welcome, or otherwise not a tenant-owned first review. */
export function isSampleReviewRun(run: SampleReviewRunFields): boolean {
  const runId = run.runId.trim();

  if (run.isSample === true) {
    return true;
  }

  if (run.isDemoWelcomeRun === true) {
    return true;
  }

  if (runId.length === 0) {
    return false;
  }

  if (isShowcaseStaticDemoRunId(runId)) {
    return true;
  }

  if (isShowcaseCreatedStaticDemoRunId(runId)) {
    return true;
  }

  if (SHOWCASE_DEMO_RUN_SLUG_KEYS.has(runId)) {
    return true;
  }

  return canonicalizeDemoRunId(runId) !== runId;
}
