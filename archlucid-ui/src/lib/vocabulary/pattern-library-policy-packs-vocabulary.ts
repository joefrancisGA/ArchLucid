/**
 * TB-2292 — Pattern library ≠ Policy packs vocabulary rail.
 *
 * Why two surfaces exist:
 * - Pattern library (`/insights/patterns`) catalogs recurring architecture patterns
 *   observed across reviews.
 * - Policy packs (`/governance/policy-packs`) are enforceable policy rule sets
 *   applied to reviews and findings.
 *
 * They stay separate because browsing pattern intelligence is not the same task as
 * authoring or activating enforceable policy packs.
 */

import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PatternLibraryPolicyPacksSurfaceId = "pattern-library" | "policy-packs";

export type PatternLibraryPolicyPacksLink = {
  readonly id: PatternLibraryPolicyPacksSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PatternLibraryPolicyPacksVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly patternLibraryLink: PatternLibraryPolicyPacksLink;
  readonly policyPacksLink: PatternLibraryPolicyPacksLink;
};

export const PATTERN_LIBRARY_POLICY_PACKS_HEADING =
  "Pattern library and Policy packs serve different purposes" as const;

export const PATTERN_LIBRARY_POLICY_PACKS_WHY_TWO =
  "The pattern library catalogs recurring architecture patterns from reviews. Policy packs are enforceable policy rule sets applied to reviews and findings. Browsing patterns does not author or activate policy packs." as const;

export const PATTERN_LIBRARY_POLICY_PACKS_COMPACT_LINE =
  "Pattern library catalogs observed patterns; Policy packs enforce policy rules." as const;

export const PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK: PatternLibraryPolicyPacksLink = {
  id: "pattern-library",
  label: "Pattern library",
  href: PATTERN_LIBRARY_PATH,
  whenToUse: "Browse recurring architecture patterns observed across reviews.",
};

export const PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK: PatternLibraryPolicyPacksLink = {
  id: "policy-packs",
  label: "Policy packs",
  href: GOVERNANCE_POLICY_PACKS_PATH,
  whenToUse: "Author, inspect, and activate enforceable policy rule sets.",
};

/** Pairwise model for Pattern library ↔ Policy packs (fixed routes). */
export function buildPatternLibraryPolicyPacksPairwiseRail(): PairwiseVocabularyRailModel<PatternLibraryPolicyPacksSurfaceId> {
  return {
    heading: PATTERN_LIBRARY_POLICY_PACKS_HEADING,
    whyTwo: PATTERN_LIBRARY_POLICY_PACKS_WHY_TWO,
    compactLine: PATTERN_LIBRARY_POLICY_PACKS_COMPACT_LINE,
    currentLink: PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK,
    peerLink: PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPatternLibraryPolicyPacksVocabulary(): PatternLibraryPolicyPacksVocabularyModel {
  const rail = buildPatternLibraryPolicyPacksPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    patternLibraryLink: rail.currentLink,
    policyPacksLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePatternLibraryPolicyPacksPeerLink(
  currentSurfaceId: PatternLibraryPolicyPacksSurfaceId,
): PatternLibraryPolicyPacksLink {
  if (currentSurfaceId === "pattern-library") {
    return PATTERN_LIBRARY_POLICY_PACKS_PACKS_LINK;
  }

  return PATTERN_LIBRARY_POLICY_PACKS_LIBRARY_LINK;
}
