/**
 * TB-2240 — Validate ≠ Compare vocabulary rail.
 *
 * Why two review surfaces exist:
 * - Validate review / replay (`/internal/validate-route`) re-checks a *single* finalized
 *   architecture package (reconstruct, rebuild, or regenerate).
 * - Compare two reviews (`/insights/compare-two-reviews`) diffs *two* packages
 *   side by side.
 *
 * They stay separate because validating one package is not the same as comparing
 * two. Operators need both surfaces with deep links so they do not treat
 * validation depth as a pairwise diff (or the reverse).
 */

import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ValidateCompareSurfaceId = "validate-replay" | "compare";

export type ValidateCompareLink = {
  readonly id: ValidateCompareSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ValidateCompareVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly validateLink: ValidateCompareLink;
  readonly compareLink: ValidateCompareLink;
};

export const VALIDATE_COMPARE_HEADING = "Validate and compare stay separate" as const;

export const VALIDATE_COMPARE_WHY_TWO =
  "Validate review re-runs checks on one finalized architecture review. Compare two reviews shows what changed between two reviews side by side. Re-checking one review is not the same as comparing two." as const;

export const VALIDATE_COMPARE_COMPACT_LINE =
  "Validate re-checks one architecture package; Compare diffs two — open the other when you need both." as const;

export const VALIDATE_COMPARE_VALIDATE_LINK: ValidateCompareLink = {
  id: "validate-replay",
  label: "Validate review",
  href: INTERNAL_REPLAY_PATH,
  whenToUse: "Re-check a single finalized architecture package.",
};

export const VALIDATE_COMPARE_COMPARE_LINK: ValidateCompareLink = {
  id: "compare",
  label: "Compare two reviews",
  href: COMPARE_TWO_REVIEWS_PATH,
  whenToUse: "Diff two architecture packages side by side.",
};

/** Pairwise model for Validate review ↔ Compare two reviews (fixed routes). */
export function buildValidateComparePairwiseRail(): PairwiseVocabularyRailModel<ValidateCompareSurfaceId> {
  return {
    heading: VALIDATE_COMPARE_HEADING,
    whyTwo: VALIDATE_COMPARE_WHY_TWO,
    compactLine: VALIDATE_COMPARE_COMPACT_LINE,
    currentLink: VALIDATE_COMPARE_VALIDATE_LINK,
    peerLink: VALIDATE_COMPARE_COMPARE_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildValidateCompareVocabulary(): ValidateCompareVocabularyModel {
  const rail = buildValidateComparePairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    validateLink: rail.currentLink,
    compareLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveValidateComparePeerLink(
  currentSurfaceId: ValidateCompareSurfaceId,
): ValidateCompareLink {
  if (currentSurfaceId === "validate-replay") {
    return VALIDATE_COMPARE_COMPARE_LINK;
  }

  return VALIDATE_COMPARE_VALIDATE_LINK;
}
