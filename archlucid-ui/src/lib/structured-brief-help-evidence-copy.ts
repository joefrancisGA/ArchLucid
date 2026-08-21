import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { ARCHITECTURE_DRAFTS_CANONICAL_PATH } from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";

export const STRUCTURED_BRIEF_HELP_CANONICAL_PATH = "/help/structured-brief" as const;

export const STRUCTURED_BRIEF_HELP_TOPIC_LABEL = "Structured brief fields" as const;

export const STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE =
  "This guide explains draft structured brief fields before review intake. It is not a finalized review record citation pack for procurement.";

export const STRUCTURED_BRIEF_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const STRUCTURED_BRIEF_HELP_SOURCES_INTRO =
  "Use these follow-ups when you need to resume drafting or start evidence intake.";

export const STRUCTURED_BRIEF_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Create architecture", href: ARCHITECTURES_NEW_PATH },
  { label: "Architecture drafts", href: ARCHITECTURE_DRAFTS_CANONICAL_PATH },
  { label: "First architecture review", href: "/help/first-architecture-review" },
];
