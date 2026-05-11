import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_BUYER_REVIEW_TITLE } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

/**
 * Short link label for audit / timeline cards — friendly title for the showcase run, otherwise the raw id.
 */
export function buyerFacingReviewLinkLabelFromRunId(runId: string): string {
  if (isShowcaseStaticDemoRunId(runId)) {
    return SHOWCASE_BUYER_REVIEW_TITLE;
  }

  const trimmed = runId.trim();

  return trimmed.length > 0 ? trimmed : "—";
}

/** Buyer-oriented review title: stable label for the curated sample; otherwise description or fallback. */
export function buyerFacingReviewTitleFromSummary(run: RunSummary): string {
  const runIdRaw = run.runId ?? "";

  if (isShowcaseStaticDemoRunId(runIdRaw)) {
    return SHOWCASE_BUYER_REVIEW_TITLE;
  }

  const displayName = run.displayName?.trim() ?? "";
  const runIdTrim = runIdRaw.trim();

  // Prefer explicit API display label when it is not just the technical run id echoed back.
  if (
    displayName.length > 0 &&
    displayName !== runIdTrim &&
    displayName.toLowerCase() !== runIdTrim.toLowerCase()
  ) {
    return displayName;
  }

  const description = run.description?.trim() ?? "";

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
