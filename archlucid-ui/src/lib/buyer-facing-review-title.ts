import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

/**
 * Short link label for audit / timeline cards — friendly title for the showcase run, otherwise the raw id.
 */
export function buyerFacingReviewLinkLabelFromRunId(runId: string): string {
  const id = canonicalizeDemoRunId(runId.trim());

  if (id === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return "Claims Intake Modernization Review";
  }

  const trimmed = runId.trim();

  return trimmed.length > 0 ? trimmed : "—";
}

/** Buyer-oriented review title: stable label for the curated sample; otherwise description or fallback. */
export function buyerFacingReviewTitleFromSummary(run: RunSummary): string {
  const id = canonicalizeDemoRunId(run.runId);

  if (id === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return "Claims Intake Modernization Review";
  }

  const description = run.description?.trim() ?? "";
  const runIdTrim = run.runId.trim();

  // Some APIs echo the run id as `description`; never show that slug as a human title.
  if (
    description.length > 0 &&
    description !== runIdTrim &&
    description.toLowerCase() !== runIdTrim.toLowerCase()
  ) {
    return description;
  }

  return "Untitled review";
}
