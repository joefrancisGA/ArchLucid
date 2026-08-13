import { ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL } from "@/lib/accelerator-chooser-help-title-honesty-surfaces";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PATH_CHOOSER_HELP_CANONICAL_PATH = "/help/choose-your-next-step" as const;

export const PATH_CHOOSER_HELP_CLAIM_DISCIPLINE =
  "This path chooser orients buyers and evaluators on the next citeable product or help surface — not a signed-review diligence Sources package from your tenant. Open Trust Center or Assurance status when sponsors need diligence evidence.";

/** Compact scope line for the action panel (HPX). */
export const PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE =
  "Buyer orientation only — not an evidence bundle from your workspace.";

export const PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO =
  "Use these follow-ups when goal branches turn into live intake, procurement cites, or accelerator packs.";

/** Related next steps — no self-href to `/help/path-chooser`. */
export const PATH_CHOOSER_HELP_RELATED_NEXT_STEPS: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL, href: inAppHelpHref("accelerator-chooser") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Trust Center", href: "/trust" },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
  { label: "Sponsor report", href: inAppHelpHref("sponsor-report") },
] as const;
