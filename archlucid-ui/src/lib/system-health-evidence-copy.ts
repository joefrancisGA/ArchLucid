import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

/**
 * Quiet honesty for Technical details / owner notes — not a first-viewport amber banner.
 * Digests owner decision 2026-08-05: claim-boundary bands read as internal drafting notes.
 */
export const SYSTEM_HEALTH_CLAIM_DISCIPLINE =
  "This page reports workspace operational readiness (live/ready checks and build identity). It is not a signed-review diligence Sources trail.";

export const SYSTEM_HEALTH_SOURCES_INTRO =
  "When a dependency needs follow-up, open connection status or troubleshooting. Digests and audit are separate operator jobs.";


/** Operator Sources — no self-href to system-health. */
export const SYSTEM_HEALTH_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Architecture digests", href: DIGESTS_HUB_PATH },
  { label: "Governance audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Troubleshooting help", href: inAppHelpHref("troubleshooting") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const SYSTEM_HEALTH_CANONICAL_PATH = "/administration/system-health" as const;

export const SYSTEM_HEALTH_HELP_TOPIC_LABEL = "How system health works";
