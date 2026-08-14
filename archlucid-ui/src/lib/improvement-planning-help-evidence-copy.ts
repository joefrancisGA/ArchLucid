import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import {
  PLANNING_CLAIM_DISCIPLINE,
  PLANNING_CLAIM_DISCIPLINE_HEADING,
  PLANNING_SOURCES,
  PLANNING_SOURCES_INTRO,
} from "@/lib/planning-evidence-copy";

export const IMPROVEMENT_PLANNING_HELP_CANONICAL_PATH = "/help/improvement-planning" as const;

export const IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL = "How improvement planning works" as const;

export const IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE = PLANNING_CLAIM_DISCIPLINE;

export const IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING = PLANNING_CLAIM_DISCIPLINE_HEADING;

export const IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO = PLANNING_SOURCES_INTRO;

export const IMPROVEMENT_PLANNING_HELP_SOURCES: readonly EvidenceOrientationLink[] = PLANNING_SOURCES;
