import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH = "/help/specialty-walkthroughs" as const;

export const SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE =
  "This walkthrough catalog shows starter review templates — help orientation only, not live workspace evidence. Open Start review or Path chooser when you need live intake.";

export const SPECIALTY_WALKTHROUGHS_HELP_CLAIM_HEADING_ID =
  "help-specialty-walkthroughs-claim-discipline-heading" as const;

export const SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO =
  "Use these follow-ups when template vocabulary turns into live intake, first-review guidance, or path selection.";


/** Operator Sources — no self-href to `/help/specialty-walkthroughs`. */
export const SPECIALTY_WALKTHROUGHS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start review", href: "/architecture/reviews/new" },
  { label: "Path chooser", href: inAppHelpHref("choose-your-next-step") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;
