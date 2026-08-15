import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  DECISION_REGISTER_CLAIM_DISCIPLINE,
  DECISION_REGISTER_SOURCES,
  DECISION_REGISTER_SOURCES_INTRO,
} from "@/lib/decision-register-evidence-copy";

export const DECISION_REGISTER_HELP_CANONICAL_PATH = "/help/decision-register" as const;

export const DECISION_REGISTER_HELP_TOPIC_LABEL = "How the decision register works" as const;

export const DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const DECISION_REGISTER_HELP_CLAIM_DISCIPLINE =
  "This guide explains how the decision register indexes architecture decisions locked with sealed review records — filter and open decisions, then follow Architecture reviews, Findings, or Sealed review records when follow-up needs review or audit context.";

/** Operator-surface claim — register page orientation band. */
export const DECISION_REGISTER_HELP_OPERATOR_CLAIM = DECISION_REGISTER_CLAIM_DISCIPLINE;

export const DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const DECISION_REGISTER_HELP_SOURCES_INTRO = DECISION_REGISTER_SOURCES_INTRO;

export const DECISION_REGISTER_HELP_SOURCES: readonly EvidenceSourceLink[] = DECISION_REGISTER_SOURCES;
