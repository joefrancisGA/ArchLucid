import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { PATH_CHOOSER_HELP_RELATED_GUIDES } from "@/lib/path-chooser-help-related-guides";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PATH_CHOOSER_HELP_CANONICAL_PATH = "/help/choose-your-next-step" as const;

export const PATH_CHOOSER_HELP_TOPIC_LABEL = "How to choose your next step" as const;

export const PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_HEADING = "Claim discipline";

export const PATH_CHOOSER_HELP_CLAIM_HEADING_ID = "claim-discipline" as const;

export const PATH_CHOOSER_HELP_CLAIM_DISCIPLINE =
  "This path chooser orients buyers and evaluators on the next citeable product or help surface — not a sealed-review diligence Sources package from your tenant. Open Trust Center or Assurance status when sponsors need diligence evidence.";

/** Compact scope line for the action panel (HPX). */
export const PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE =
  "Buyer orientation only — not an evidence bundle from your workspace.";

export const PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE = "Related next steps";

export const PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO =
  "Use these follow-ups when goal branches turn into live intake, procurement cites, or accelerator packs.";

const PATH_CHOOSER_HELP_EXCLUDED_SOURCE_HREFS = new Set<string>([
  "/architecture/reviews/new",
  inAppHelpHref("security-trust"),
  inAppHelpHref("first-architecture-review"),
]);

/** Help Sources — excludes action-panel destinations already above the fold. */
export const PATH_CHOOSER_HELP_SOURCES: readonly EvidenceSourceLink[] = PATH_CHOOSER_HELP_RELATED_GUIDES.filter(
  (source) => !PATH_CHOOSER_HELP_EXCLUDED_SOURCE_HREFS.has(source.href),
);

/** Related next steps — no self-href to `/help/choose-your-next-step`. */
export const PATH_CHOOSER_HELP_RELATED_NEXT_STEPS: readonly EvidenceSourceLink[] =
  PATH_CHOOSER_HELP_RELATED_GUIDES;
