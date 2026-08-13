import { getShowcaseExecutiveHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { appendBuyerCtoDemoTourStartQuery } from "@/lib/buyer/buyer-cto-demo-tour";

export const CTO_DEMO_FAST_CREATE_TOTAL_MS = 15_000;

export const CTO_DEMO_FAST_CREATE_STAGE_LABELS = [
  "Capturing your architecture brief",
  "Mapping architecture structure and dependencies",
  "Finding architecture risks",
  "Writing recommendations",
  "Preparing your review",
] as const;

/** Deterministic simulated create lands on the showcase executive summary (#5). */
export function getCtoDemoFastCreateDestinationHref(): string {
  return appendBuyerCtoDemoTourStartQuery(getShowcaseExecutiveHref());
}

export function ctoDemoFastCreateStageIndex(elapsedMs: number): number {
  const stageMs = CTO_DEMO_FAST_CREATE_TOTAL_MS / CTO_DEMO_FAST_CREATE_STAGE_LABELS.length;
  const idx = Math.floor(elapsedMs / stageMs);

  return Math.min(idx, CTO_DEMO_FAST_CREATE_STAGE_LABELS.length - 1);
}
