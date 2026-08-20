import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Alias kept for call sites that name the core-pilot Sources row type explicitly. */
export type CorePilotHelpSourceLink = EvidenceSourceLink;

export const CORE_PILOT_HELP_CANONICAL_PATH = "/help/first-architecture-review" as const;

export const CORE_PILOT_HELP_CLAIM_DISCIPLINE =
  "This first-architecture-review guide is orientation for your first evidence-to-finalize path — not a full audit export. Open Reviews, Audit, or Assurance status for official records.";

export const CORE_PILOT_HELP_SOURCES_INTRO =
  "Use these follow-ups when the guided path turns into starting a review, cloud attachment, pilot depth, or troubleshooting.";


/** Operator Sources — no self-href to `/help/first-architecture-review`. */
export const CORE_PILOT_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "First review guide", href: FIRST_REVIEW_GUIDE_PATH },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;
