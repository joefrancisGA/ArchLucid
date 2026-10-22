/**
 * TB-2283 — Pack detail ≠ Policy packs hub vocabulary rail.
 *
 * Why two policy-pack surfaces exist:
 * - Policy packs (`/governance/policy-packs`) is the hub to assign, author, and
 *   browse policy packs for a scope.
 * - Pack detail (`/governance/policy-packs/[id]`) inspects one pack’s narrative
 *   and metadata.
 *
 * They stay separate because browsing the packs library is not inspecting a
 * single pack. Distinct from Policy packs ≠ Standards and rules (TB-2239),
 * which reconciles pack assignment with effective standards.
 */

import { GOVERNANCE_POLICY_PACKS_PATH, governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PolicyPackDetailHubSurfaceId = "policy-packs" | "pack-detail";

export type PolicyPackDetailHubLink = {
  readonly id: PolicyPackDetailHubSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PolicyPackDetailHubVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly packsHubLink: PolicyPackDetailHubLink;
  readonly packDetailLink: PolicyPackDetailHubLink;
};

export const POLICY_PACK_DETAIL_HUB_HEADING =
  "Pack detail and Policy packs serve different purposes" as const;

export const POLICY_PACK_DETAIL_HUB_WHY_TWO =
  "Policy packs is the hub to assign, author, and browse policy packs for a scope. Pack detail inspects one pack’s narrative and metadata. The library is not a single pack workspace." as const;

export const POLICY_PACK_DETAIL_HUB_COMPACT_LINE =
  "Policy packs assigns and browses the library; Pack detail inspects one pack — open the other when you need both." as const;

export const POLICY_PACK_DETAIL_HUB_PACKS_LINK: PolicyPackDetailHubLink = {
  id: "policy-packs",
  label: "Policy packs",
  href: GOVERNANCE_POLICY_PACKS_PATH,
  whenToUse: "Assign, author, or browse policy packs for a scope.",
};

/** Pack detail is per-pack; href uses the packs hub as the stable peer home. */
export const POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK: PolicyPackDetailHubLink = {
  id: "pack-detail",
  label: "Pack detail",
  href: GOVERNANCE_POLICY_PACKS_PATH,
  whenToUse: "Inspect one policy pack’s narrative and metadata.",
};

/** Pairwise model for Policy packs hub ↔ Pack detail (peer href may be scoped per pack). */
export function buildPolicyPackDetailHubPairwiseRail(): PairwiseVocabularyRailModel<PolicyPackDetailHubSurfaceId> {
  return {
    heading: POLICY_PACK_DETAIL_HUB_HEADING,
    whyTwo: POLICY_PACK_DETAIL_HUB_WHY_TWO,
    compactLine: POLICY_PACK_DETAIL_HUB_COMPACT_LINE,
    currentLink: POLICY_PACK_DETAIL_HUB_PACKS_LINK,
    peerLink: POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPolicyPackDetailHubVocabulary(): PolicyPackDetailHubVocabularyModel {
  const rail = buildPolicyPackDetailHubPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    packsHubLink: rail.currentLink,
    packDetailLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePolicyPackDetailHubPeerLink(
  currentSurfaceId: PolicyPackDetailHubSurfaceId,
  policyPackId?: string,
): PolicyPackDetailHubLink {
  if (currentSurfaceId === "policy-packs") {
    const id = policyPackId?.trim() ?? "";

    if (id.length > 0) {
      return {
        ...POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK,
        href: governancePolicyPackDetailPath(id),
      };
    }

    return POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK;
  }

  return POLICY_PACK_DETAIL_HUB_PACKS_LINK;
}
