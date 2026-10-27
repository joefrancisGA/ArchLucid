import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { isShowcaseCreatedStaticDemoRunId, isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { stripRetiredDemoOrgBranding } from "@/lib/retired-demo-org-branding";
import { toReviewDisplayTitle } from "@/lib/review-display-title";
import { SHOWCASE_BUYER_CREATED_PACKAGE_TITLE } from "@/lib/showcase-created-static-demo";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_BUYER_REVIEW_TITLE } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

/**
 * Short link label for audit / timeline cards — friendly title for the showcase run, otherwise the raw id.
 */
export function buyerFacingReviewLinkLabelFromRunId(runId: string): string {
  if (isShowcaseStaticDemoRunId(runId)) {
    return SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE;
  }

  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return "Review id was not stored.";
  }

  return `Review title is not on this strip. Review id: ${trimmed}.`;
}

/** Buyer-oriented review title: stable label for the curated sample; otherwise description or fallback. */
export function buyerFacingReviewTitleFromSummary(run: RunSummary): string {
  const runIdRaw = run.runId ?? "";
  const compareFriendly = compareRunBuyerDisplayLabel(runIdRaw.trim());

  if (compareFriendly !== null) {
    return compareFriendly;
  }

  if (isShowcaseStaticDemoRunId(runIdRaw)) {
    return SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE;
  }

  if (isShowcaseCreatedStaticDemoRunId(runIdRaw)) {
    return SHOWCASE_BUYER_CREATED_PACKAGE_TITLE;
  }

  const runIdTrim = runIdRaw.trim();

  if (run.displayName !== null && run.displayName !== undefined) {
    const displayName = stripRetiredDemoOrgBranding(run.displayName).trim();

    if (displayName.length === 0) {
      return "Review display name was stored empty.";
    }

    // Prefer explicit API display label when it is not just the technical run id echoed back.
    if (
      displayName !== runIdTrim &&
      displayName.toLowerCase() !== runIdTrim.toLowerCase()
    ) {
      // An unusable label (uploaded-document fragment) normalizes to empty, so keep falling through
      // the chain rather than rendering a blank title on list and favourites surfaces.
      const normalizedDisplayName = toReviewDisplayTitle(displayName);

      if (normalizedDisplayName.length > 0) {
        return normalizedDisplayName;
      }
    }
  }

  if (run.displayName === null && run.description === null) {
    return "Review title was not stored.";
  }

  const description = stripRetiredDemoOrgBranding(run.description).trim();

  if (run.description !== null && run.description !== undefined && description.length === 0) {
    return "Review description was not stored.";
  }

  // Some APIs echo the run id as `description`; never show that slug as a human title.
  if (
    description.length > 0 &&
    description !== runIdTrim &&
    description.toLowerCase() !== runIdTrim.toLowerCase()
  ) {
    const normalizedDescription = toReviewDisplayTitle(description);

    if (normalizedDescription.length > 0) {
      return normalizedDescription;
    }
  }

  return "Review title was not stored.";
}
