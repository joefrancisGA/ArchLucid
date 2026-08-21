import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_DRAFTS_CANONICAL_PATH,
  ARCHITECTURE_DRAFTS_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_SOURCES,
} from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
export const ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH = "/help/architecture-drafts" as const;

export const ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE =
  "This guide orients draft editing before review intake. It is not where procurement goes for finalized review record citations — open Finalized review records or Assurance status when procurement needs citations.";

export const ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when you need to create a new architecture, start review intake, or get oriented.";

const ARCHITECTURE_DRAFTS_HELP_EXCLUDED_SOURCE_HREFS = new Set<string>([
  REVIEWS_NEW_PATH,
  ARCHITECTURES_NEW_PATH,
  ARCHITECTURE_DRAFTS_CANONICAL_PATH,
]);

/** Help Sources — excludes action-panel destinations already above the fold. */
export const ARCHITECTURE_DRAFTS_HELP_SOURCES: readonly EvidenceSourceLink[] = ARCHITECTURE_DRAFTS_SOURCES.filter(
  (source) => !ARCHITECTURE_DRAFTS_HELP_EXCLUDED_SOURCE_HREFS.has(source.href),
);

export const ARCHITECTURE_DRAFTS_HELP_OPERATOR_CLAIM = ARCHITECTURE_DRAFTS_CLAIM_DISCIPLINE;
