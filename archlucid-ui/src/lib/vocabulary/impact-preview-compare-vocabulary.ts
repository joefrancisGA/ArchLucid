/**
 * TB-2250 — Impact preview ≠ Compare vocabulary rail.
 *
 * Why two insight surfaces exist:
 * - Impact preview (`/insights/impact-preview`) simulates the *expected impact*
 *   of a proposed architecture change against a baseline architecture package.
 * - Compare two reviews (`/insights/compare-two-reviews`) diffs *two finalized*
 *   architecture packages side by side.
 *
 * They stay separate because simulating proposed change impact is not the same
 * as pairwise comparison of two reviews. Distinct from Validate ≠ Compare
 * (TB-2240), which reconciles single-package validation depth with pairwise
 * diff — do not conflate those rails.
 */

import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

export type ImpactPreviewCompareSurfaceId = "impact-preview" | "compare";

export type ImpactPreviewCompareLink = {
  readonly id: ImpactPreviewCompareSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ImpactPreviewCompareVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly impactPreviewLink: ImpactPreviewCompareLink;
  readonly compareLink: ImpactPreviewCompareLink;
};

export const IMPACT_PREVIEW_COMPARE_HEADING =
  "Impact preview and Compare serve different purposes" as const;

export const IMPACT_PREVIEW_COMPARE_WHY_TWO =
  "Impact preview simulates the expected impact of a proposed architecture change against a baseline architecture package. Compare two reviews diffs two finalized architecture packages side by side. A change simulation is not a pairwise review diff." as const;

export const IMPACT_PREVIEW_COMPARE_COMPACT_LINE =
  "Impact preview simulates proposed changes; Compare diffs two architecture packages — open the other when you need both." as const;

export const IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK: ImpactPreviewCompareLink = {
  id: "impact-preview",
  label: "Impact preview",
  href: IMPACT_PREVIEW_PATH,
  whenToUse: "Simulate expected impact of a proposed architecture change.",
};

export const IMPACT_PREVIEW_COMPARE_COMPARE_LINK: ImpactPreviewCompareLink = {
  id: "compare",
  label: "Compare two reviews",
  href: COMPARE_TWO_REVIEWS_PATH,
  whenToUse: "Diff two finalized architecture packages side by side.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildImpactPreviewCompareVocabulary(): ImpactPreviewCompareVocabularyModel {
  return {
    heading: IMPACT_PREVIEW_COMPARE_HEADING,
    whyTwo: IMPACT_PREVIEW_COMPARE_WHY_TWO,
    compactLine: IMPACT_PREVIEW_COMPARE_COMPACT_LINE,
    impactPreviewLink: IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK,
    compareLink: IMPACT_PREVIEW_COMPARE_COMPARE_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveImpactPreviewComparePeerLink(
  currentSurfaceId: ImpactPreviewCompareSurfaceId,
): ImpactPreviewCompareLink {
  if (currentSurfaceId === "impact-preview") {
    return IMPACT_PREVIEW_COMPARE_COMPARE_LINK;
  }

  return IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK;
}
