import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

/** Buyer-oriented review title: stable label for the curated sample; otherwise description or fallback. */
export function buyerFacingReviewTitleFromSummary(run: RunSummary): string {
  const id = canonicalizeDemoRunId(run.runId);

  if (id === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return "Claims Intake Modernization Review";
  }

  const description = run.description?.trim() ?? "";

  if (description.length > 0) {
    return description;
  }

  return "Untitled review";
}
