/**
 * TB-2239 — Policy packs ≠ Standards and rules vocabulary rail.
 *
 * Why two governance surfaces exist:
 * - Policy packs (`/governance/policy-packs`) assign and author the packs that
 *   contribute governance rules for a scope.
 * - Standards and rules (`/governance/standards-and-rules`) show the *effective*
 *   resolved rules after pack precedence and conflict resolution.
 *
 * They stay separate because editing pack assignments is not the same as
 * reading the live effective rule set. Operators need both surfaces with deep
 * links so they do not treat pack catalogs as the resolved standards table.
 */

import {
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance-route-paths";

export type PolicyPacksStandardsSurfaceId = "policy-packs" | "standards-and-rules";

export type PolicyPacksStandardsLink = {
  readonly id: PolicyPacksStandardsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PolicyPacksStandardsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly policyPacksLink: PolicyPacksStandardsLink;
  readonly standardsLink: PolicyPacksStandardsLink;
};

export const POLICY_PACKS_STANDARDS_HEADING = "Policy packs and standards stay separate" as const;

export const POLICY_PACKS_STANDARDS_WHY_TWO =
  "Policy packs are the assignable governance templates you author and pin to a scope. Standards and rules show the effective compliance rules after pack precedence and conflict resolution. Changing a pack assignment is not the same as reading the live standards table — open the peer link when you need the other job." as const;

export const POLICY_PACKS_STANDARDS_COMPACT_LINE =
  "Policy packs assign templates; Standards and rules show effective rules — open the other when you need both." as const;

export const POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK: PolicyPacksStandardsLink = {
  id: "policy-packs",
  label: "Policy packs",
  href: GOVERNANCE_POLICY_PACKS_PATH,
  whenToUse: "Assign, author, or inspect governance policy packs for a scope.",
};

export const POLICY_PACKS_STANDARDS_STANDARDS_LINK: PolicyPacksStandardsLink = {
  id: "standards-and-rules",
  label: "Standards and rules",
  href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
  whenToUse: "Read the effective standards and rules after pack resolution.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPolicyPacksStandardsVocabulary(): PolicyPacksStandardsVocabularyModel {
  return {
    heading: POLICY_PACKS_STANDARDS_HEADING,
    whyTwo: POLICY_PACKS_STANDARDS_WHY_TWO,
    compactLine: POLICY_PACKS_STANDARDS_COMPACT_LINE,
    policyPacksLink: POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK,
    standardsLink: POLICY_PACKS_STANDARDS_STANDARDS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePolicyPacksStandardsPeerLink(
  currentSurfaceId: PolicyPacksStandardsSurfaceId,
): PolicyPacksStandardsLink {
  if (currentSurfaceId === "policy-packs") {
    return POLICY_PACKS_STANDARDS_STANDARDS_LINK;
  }

  return POLICY_PACKS_STANDARDS_POLICY_PACKS_LINK;
}
