/**
 * TB-2291 — Decision register ≠ Findings vocabulary rail.
 *
 * Why two surfaces exist:
 * - Decision register (`/governance/decision-register`) records locked architecture
 *   dispositions from completed reviews.
 * - Findings queue (`/governance/findings`) is risk disposition work — triage and
 *   resolve open governance findings.
 *
 * They stay separate because the decision register is the locked disposition record,
 * not the same list as open findings triage. Distinct from empty-state teaching (TB-2263).
 */

import {
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type DecisionRegisterFindingsSurfaceId = "decision-register" | "findings-queue";

export type DecisionRegisterFindingsLink = {
  readonly id: DecisionRegisterFindingsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DecisionRegisterFindingsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly decisionRegisterLink: DecisionRegisterFindingsLink;
  readonly findingsQueueLink: DecisionRegisterFindingsLink;
};

export const DECISION_REGISTER_FINDINGS_HEADING =
  "Decision register and Findings queue serve different purposes" as const;

export const DECISION_REGISTER_FINDINGS_WHY_TWO =
  "The decision register records locked architecture dispositions from completed reviews. The findings queue is risk disposition work for open governance findings. Locked decisions are not the same list as findings triage." as const;

export const DECISION_REGISTER_FINDINGS_COMPACT_LINE =
  "Decision register holds locked dispositions; Findings queue triages open risk work." as const;

export const DECISION_REGISTER_FINDINGS_REGISTER_LINK: DecisionRegisterFindingsLink = {
  id: "decision-register",
  label: "Decision register",
  href: GOVERNANCE_DECISION_REGISTER_PATH,
  whenToUse: "Browse locked architecture dispositions from completed reviews.",
};

export const DECISION_REGISTER_FINDINGS_QUEUE_LINK: DecisionRegisterFindingsLink = {
  id: "findings-queue",
  label: "Findings queue",
  href: GOVERNANCE_FINDINGS_PATH,
  whenToUse: "Triage and resolve open governance findings.",
};

/** Pairwise model for Decision register ↔ Findings queue (fixed governance routes). */
export function buildDecisionRegisterFindingsPairwiseRail(): PairwiseVocabularyRailModel<DecisionRegisterFindingsSurfaceId> {
  return {
    heading: DECISION_REGISTER_FINDINGS_HEADING,
    whyTwo: DECISION_REGISTER_FINDINGS_WHY_TWO,
    compactLine: DECISION_REGISTER_FINDINGS_COMPACT_LINE,
    currentLink: DECISION_REGISTER_FINDINGS_REGISTER_LINK,
    peerLink: DECISION_REGISTER_FINDINGS_QUEUE_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildDecisionRegisterFindingsVocabulary(): DecisionRegisterFindingsVocabularyModel {
  const rail = buildDecisionRegisterFindingsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    decisionRegisterLink: rail.currentLink,
    findingsQueueLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveDecisionRegisterFindingsPeerLink(
  currentSurfaceId: DecisionRegisterFindingsSurfaceId,
): DecisionRegisterFindingsLink {
  if (currentSurfaceId === "decision-register") {
    return DECISION_REGISTER_FINDINGS_QUEUE_LINK;
  }

  return DECISION_REGISTER_FINDINGS_REGISTER_LINK;
}
