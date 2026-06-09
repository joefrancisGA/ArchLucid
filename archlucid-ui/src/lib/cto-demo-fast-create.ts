import { getCanonicalReviewWorkspaceHref } from "@/lib/buyer-safe-review-navigation";
import { appendBuyerCtoDemoTourStartQuery } from "@/lib/buyer-cto-demo-tour";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const CTO_DEMO_FAST_CREATE_TOTAL_MS = 15_000;

export const CTO_DEMO_FAST_CREATE_STAGE_LABELS = [
  "Capturing your architecture brief",
  "Mapping topology and dependencies",
  "Finding architecture risks",
  "Writing recommendations",
  "Preparing your review package",
] as const;

/** Deterministic simulated create lands on the committed showcase review (#5). */
export function getCtoDemoFastCreateDestinationHref(): string {
  return appendBuyerCtoDemoTourStartQuery(getCanonicalReviewWorkspaceHref(SHOWCASE_STATIC_DEMO_RUN_ID));
}

export function ctoDemoFastCreateStageIndex(elapsedMs: number): number {
  const stageMs = CTO_DEMO_FAST_CREATE_TOTAL_MS / CTO_DEMO_FAST_CREATE_STAGE_LABELS.length;
  const idx = Math.floor(elapsedMs / stageMs);

  return Math.min(idx, CTO_DEMO_FAST_CREATE_STAGE_LABELS.length - 1);
}
