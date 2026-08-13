import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  DECISION_REGISTER_CLAIM_DISCIPLINE,
  DECISION_REGISTER_SOURCES,
  DECISION_REGISTER_SOURCES_INTRO,
} from "@/lib/decision-register-evidence-copy";

export const DECISION_REGISTER_HELP_CANONICAL_PATH = "/help/decision-register" as const;

export const DECISION_REGISTER_HELP_TOPIC_LABEL = "How the decision register works" as const;

export const DECISION_REGISTER_HELP_CLAIM_DISCIPLINE = DECISION_REGISTER_CLAIM_DISCIPLINE;

export const DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const DECISION_REGISTER_HELP_SOURCES_INTRO = DECISION_REGISTER_SOURCES_INTRO;

export const DECISION_REGISTER_HELP_SOURCES: readonly EvidenceSourceLink[] = DECISION_REGISTER_SOURCES;
