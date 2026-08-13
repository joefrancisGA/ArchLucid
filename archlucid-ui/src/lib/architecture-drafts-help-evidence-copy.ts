import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_DRAFTS_CANONICAL_PATH,
  ARCHITECTURE_DRAFTS_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_SOURCES,
  ARCHITECTURE_DRAFTS_SOURCES_INTRO,
} from "@/lib/architecture-drafts-evidence-copy";

export const ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH = "/help/architecture-drafts" as const;

export const ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE =
  "This guide explains how architecture drafts relate to review intake — it is not a signed-review diligence Sources package.";

export const ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO = ARCHITECTURE_DRAFTS_SOURCES_INTRO;

export const ARCHITECTURE_DRAFTS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture drafts", href: ARCHITECTURE_DRAFTS_CANONICAL_PATH },
  ...ARCHITECTURE_DRAFTS_SOURCES,
] as const;

export const ARCHITECTURE_DRAFTS_HELP_OPERATOR_CLAIM = ARCHITECTURE_DRAFTS_CLAIM_DISCIPLINE;
