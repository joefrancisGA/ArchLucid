import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { PILOT_GUIDE_HELP_RELATED_GUIDES } from "@/lib/pilot-guide-help-related-guides";

export const PILOT_GUIDE_HELP_CANONICAL_PATH = "/help/pilot-guide" as const;

export const PILOT_GUIDE_HELP_TOPIC_LABEL = "How the pilot guide works" as const;

export const PILOT_GUIDE_HELP_CLAIM_DISCIPLINE =
  "This pilot guide is architect orientation for running an evaluation pilot — it is not a sealed-review diligence Sources package. Open Reviews, Audit, or Assurance status when you need live packages or assurance claims.";

export const PILOT_GUIDE_HELP_SOURCES_INTRO =
  "Use these follow-ups when pilot prep turns into starting a review, first-run onboarding, or sponsor outcomes.";


/** Operator Sources — no self-href to `/help/pilot-guide`. */
export const PILOT_GUIDE_HELP_SOURCES: readonly EvidenceSourceLink[] = PILOT_GUIDE_HELP_RELATED_GUIDES;
