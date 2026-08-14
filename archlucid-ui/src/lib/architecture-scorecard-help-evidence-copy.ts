import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH = "/help/architecture-scorecard" as const;

export const ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace throughput tiles and directional review-time savings — open the architecture scorecard, ROI summary, or baseline settings when sponsors need live figures or assumption tuning.";

export const ARCHITECTURE_SCORECARD_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID =
  "help-architecture-scorecard-claim-discipline-heading" as const;

export const ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE = "Related evidence and sources";

export const ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO =
  "Finalize reviews so throughput tiles populate before you cite savings in sponsor conversations.";

export const ARCHITECTURE_SCORECARD_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
] as const;
