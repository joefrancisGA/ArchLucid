import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

import {

  SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH,

  SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE,

  SEARCH_REVIEW_EVIDENCE_SOURCES,

  SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO,

} from "@/lib/search-review-evidence-evidence-copy";



export const SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH = "/help/search-review-evidence" as const;



export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE =

  "This guide explains how search retrieves findings, decisions, and signed review evidence — it is not a sealed-review diligence Sources package.";



export const SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";



export const SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO = SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO;



export const SEARCH_REVIEW_EVIDENCE_HELP_SOURCES: readonly EvidenceSourceLink[] = [

  { label: "Search review evidence", href: SEARCH_REVIEW_EVIDENCE_CANONICAL_PATH },

  ...SEARCH_REVIEW_EVIDENCE_SOURCES,

] as const;



export const SEARCH_REVIEW_EVIDENCE_HELP_OPERATOR_CLAIM = SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE;


