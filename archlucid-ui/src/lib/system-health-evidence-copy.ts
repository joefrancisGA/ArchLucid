import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/**
 * Quiet honesty for Technical details / owner notes — not a first-viewport amber banner.
 * Digests owner decision 2026-08-05: claim-boundary bands read as internal drafting notes.
 */
export const SYSTEM_HEALTH_CLAIM_DISCIPLINE =
  "This page reports workspace operational readiness (live/ready checks and build identity). It is not a signed-review diligence package.";

export const SYSTEM_HEALTH_SOURCES_INTRO =
  "When a dependency needs follow-up, open connection status or troubleshooting. Digests and audit are separate operator jobs.";

export type SystemHealthSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to system-health. */
export const SYSTEM_HEALTH_SOURCES: readonly SystemHealthSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Architecture digests", href: DIGESTS_HUB_PATH },
  { label: "Governance audit", href: "/governance/audit" },
  { label: "Troubleshooting help", href: inAppHelpHref("troubleshooting") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;

export const SYSTEM_HEALTH_CANONICAL_PATH = "/administration/system-health" as const;
