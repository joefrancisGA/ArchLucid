/**
 * TB-2263 — Decision register empty teaching.
 *
 * Empty Decision register does not mean the tenant has no reviews or findings.
 * Architecture decisions appear after a review is finalized and decisions are
 * locked with the signed review record. Findings triage is a different job —
 * open the findings queue to disposition risks, or start a review to produce
 * a signed review record that can populate this register.
 */

import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance/governance-findings-evidence-copy";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

export type DecisionRegisterEmptyTeachingActionId =
  | "triage-findings"
  | "start-review"
  | "open-reviews";

export type DecisionRegisterEmptyTeachingAction = {
  readonly id: DecisionRegisterEmptyTeachingActionId;
  readonly label: string;
  readonly href: string;
};

export type DecisionRegisterEmptyTeachingModel = {
  readonly title: string;
  readonly body: string;
  readonly honestyLine: string;
  readonly actions: readonly DecisionRegisterEmptyTeachingAction[];
};

export const DECISION_REGISTER_EMPTY_TEACHING_TITLE =
  "No architecture decisions recorded yet" as const;

export const DECISION_REGISTER_EMPTY_TEACHING_BODY =
  "Finalize a review to lock its signed review record. Architecture decisions from that package then appear here with findings and evidence lineage." as const;

export const DECISION_REGISTER_EMPTY_TEACHING_HONESTY =
  "An empty Decision register does not mean the findings queue is empty — triage risks there, then record decisions here after finalize." as const;

export const DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION: DecisionRegisterEmptyTeachingAction =
  {
    id: "triage-findings",
    label: "Triage findings",
    href: GOVERNANCE_FINDINGS_CANONICAL_PATH,
  };

export const DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION: DecisionRegisterEmptyTeachingAction =
  {
    id: "start-review",
    label: START_REVIEW_LABEL,
    href: REVIEWS_NEW_PATH,
  };

export const DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION: DecisionRegisterEmptyTeachingAction =
  {
    id: "open-reviews",
    label: "Open reviews",
    href: REVIEWS_LIST_PATH,
  };

/** Full empty-teaching model (title, body, honesty, and next-step links). */
export function buildDecisionRegisterEmptyTeaching(): DecisionRegisterEmptyTeachingModel {
  return {
    title: DECISION_REGISTER_EMPTY_TEACHING_TITLE,
    body: DECISION_REGISTER_EMPTY_TEACHING_BODY,
    honestyLine: DECISION_REGISTER_EMPTY_TEACHING_HONESTY,
    actions: [
      DECISION_REGISTER_EMPTY_TEACHING_FINDINGS_ACTION,
      DECISION_REGISTER_EMPTY_TEACHING_START_REVIEW_ACTION,
      DECISION_REGISTER_EMPTY_TEACHING_OPEN_REVIEWS_ACTION,
    ],
  };
}
