import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DIGESTS_HELP_CANONICAL_PATH = "/help/digests" as const;

export const DIGESTS_HELP_TOPIC_LABEL = "How architecture digests work" as const;

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

export type DigestsHelpSubscriptionConstraint = {
  readonly label: string;
  readonly detail: string;
};

export const DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS_TITLE = "Subscription scope and delivery";

export const DIGESTS_HELP_SUBSCRIPTION_CONSTRAINTS: readonly DigestsHelpSubscriptionConstraint[] = [
  {
    label: "Required role",
    detail:
      "Creating, enabling, or disabling digest subscriptions requires a role that can manage digests in this workspace.",
  },
  {
    label: "Recipient eligibility",
    detail:
      "Email and webhook destinations must belong to your organization. Addresses outside tenant policy may be blocked by workspace settings.",
  },
  {
    label: "Payload detail",
    detail:
      "Architecture digests include summary text and links back to ArchLucid. Raw evidence files are not attached unless your workspace enables that separately.",
  },
  {
    label: "Delivery failures",
    detail:
      "Failed delivery attempts appear on the Subscriptions tab under Delivery attempts for each destination.",
  },
] as const;

export const DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_LINK = {
  label: "Audit trail help",
  href: inAppHelpHref("audit-trail"),
} as const;

export const DIGESTS_HELP_SUBSCRIPTION_AUDIT_TRAIL_NOTE =
  "Subscription changes are recorded in the audit trail.";
