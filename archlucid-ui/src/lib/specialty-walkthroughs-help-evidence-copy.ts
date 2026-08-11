import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH = "/help/specialty-walkthroughs" as const;

export const SPECIALTY_WALKTHROUGHS_HELP_CLAIM_DISCIPLINE =
  "This Specialty walkthroughs catalog orients architects on starter review templates — it is help orientation and intake scaffolding, not a signed-review diligence Sources package from your tenant. Open Start review or Path chooser when you need live intake.";

export const SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO =
  "Use these follow-ups when template vocabulary turns into live intake, first-review guidance, or path selection.";


/** Operator Sources — no self-href to `/help/specialty-walkthroughs`. */
export const SPECIALTY_WALKTHROUGHS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start review", href: "/architecture/reviews/new" },
  { label: "Path chooser", href: inAppHelpHref("path-chooser") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
] as const;
