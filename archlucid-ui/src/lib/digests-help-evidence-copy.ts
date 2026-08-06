import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DIGESTS_HELP_CANONICAL_PATH = "/help/digests" as const;

export const DIGESTS_HELP_CLAIM_DISCIPLINE =
  "This digests guide explains scheduled operator summaries — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Schedule, Subscriptions, or Browse when you need live configuration.";

export const DIGESTS_HELP_SOURCES_INTRO =
  "Use these follow-ups when cadence, recipients, or generated digests still need attention.";

export type DigestsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/digests`. */
export const DIGESTS_HELP_SOURCES: readonly DigestsHelpSourceLink[] = [
  { label: "Schedule", href: DIGESTS_SCHEDULE_TAB_PATH },
  { label: "Subscriptions", href: DIGESTS_SUBSCRIPTIONS_TAB_PATH },
  { label: "Browse digests", href: DIGESTS_BROWSE_TAB_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Alerts help", href: inAppHelpHref("alerts") },
] as const;
