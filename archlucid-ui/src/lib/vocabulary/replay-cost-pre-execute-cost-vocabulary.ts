/**
 * TB-2284 — Replay cost ≠ Pre-execute cost vocabulary rail.
 *
 * Why two cost surfaces exist:
 * - Comparison replay cost (`/insights/compare-two-reviews` diagnostics) estimates
 *   the relative cost band of replaying a *saved comparison record*.
 * - Pre-execute cost teaching (start-review / draft handoff) explains what starting
 *   a *new architecture package* may consume against allotment — never inventing
 *   dollars when preview is inactive (TB-2233 teaching itself stays separate).
 *
 * They stay separate because comparison-replay cost bands are not pre-execute
 * allotment teaching. Operators need both with deep links so they do not treat
 * one cost estimate as the other.
 */

import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";

export type ReplayCostPreExecuteCostSurfaceId = "replay-cost" | "pre-execute-cost";

export type ReplayCostPreExecuteCostLink = {
  readonly id: ReplayCostPreExecuteCostSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ReplayCostPreExecuteCostVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  /** Both figures are estimates for different jobs — not invoices. */
  readonly estimatesHonesty: string;
  readonly replayCostLink: ReplayCostPreExecuteCostLink;
  readonly preExecuteCostLink: ReplayCostPreExecuteCostLink;
};

export const REPLAY_COST_PRE_EXECUTE_COST_HEADING =
  "Replay cost and pre-execute cost stay separate" as const;

export const REPLAY_COST_PRE_EXECUTE_COST_WHY_TWO =
  "Comparison replay cost estimates the relative cost band of replaying a saved comparison record. Pre-execute cost explains what starting a new architecture package may consume against allotment. One estimate does not replace the other — open the peer link when you need that job." as const;

export const REPLAY_COST_PRE_EXECUTE_COST_COMPACT_LINE =
  "Replay cost is comparison-replay bands; Pre-execute cost is start-review allotment teaching — open the other when you need both." as const;

export const REPLAY_COST_PRE_EXECUTE_COST_ESTIMATES_HONESTY =
  "Both figures are estimates for different jobs — they are not invoices or billed amounts." as const;

export const REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK: ReplayCostPreExecuteCostLink = {
  id: "replay-cost",
  label: "Comparison replay cost",
  href: COMPARE_TWO_REVIEWS_PATH,
  whenToUse: "Estimate the relative cost band before replaying a saved comparison.",
};

export const REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK: ReplayCostPreExecuteCostLink = {
  id: "pre-execute-cost",
  label: "Pre-execute cost",
  href: REVIEWS_NEW_PATH,
  whenToUse: "See what starting a new architecture package may consume against allotment.",
};

/** Full vocabulary model (heading, why-two, honesty, and deep links). */
export function buildReplayCostPreExecuteCostVocabulary(): ReplayCostPreExecuteCostVocabularyModel {
  return {
    heading: REPLAY_COST_PRE_EXECUTE_COST_HEADING,
    whyTwo: REPLAY_COST_PRE_EXECUTE_COST_WHY_TWO,
    compactLine: REPLAY_COST_PRE_EXECUTE_COST_COMPACT_LINE,
    estimatesHonesty: REPLAY_COST_PRE_EXECUTE_COST_ESTIMATES_HONESTY,
    replayCostLink: REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK,
    preExecuteCostLink: REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveReplayCostPreExecuteCostPeerLink(
  currentSurfaceId: ReplayCostPreExecuteCostSurfaceId,
): ReplayCostPreExecuteCostLink {
  if (currentSurfaceId === "replay-cost") {
    return REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK;
  }

  return REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK;
}
