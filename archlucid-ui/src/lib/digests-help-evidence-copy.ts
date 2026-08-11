import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DIGESTS_HELP_CANONICAL_PATH = "/help/digests" as const;

export const DIGESTS_HELP_CLAIM_DISCIPLINE =
  "This digests guide explains scheduled digest summaries — it is not a signed review record evidence trail.";

export const DIGESTS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const DIGESTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when cadence, recipients, or generated digests still need attention.";

/** Cross-topic follow-ups — hub tabs are linked from destination cards only. */
export const DIGESTS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Alerts help", href: inAppHelpHref("alerts") },
] as const;
