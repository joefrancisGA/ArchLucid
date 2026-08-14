import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

import {
  SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_SOURCES,
  SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO,
} from "@/lib/search-review-evidence-evidence-copy";

export const SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH = "/help/search-review-evidence" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING = "What search review evidence is not";

export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE = SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE;

export const SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO = SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO;

/** Help Sources — no self-href to `/help/search-review-evidence`. */
export const SEARCH_REVIEW_EVIDENCE_HELP_SOURCES: readonly EvidenceSourceLink[] = SEARCH_REVIEW_EVIDENCE_SOURCES;
