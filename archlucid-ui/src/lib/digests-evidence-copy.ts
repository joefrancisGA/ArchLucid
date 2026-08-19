import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const DIGESTS_SOURCES_INTRO =
  "Configure subscriptions and schedule before treating digests as an operating rhythm; open reviews or findings when a summary needs follow-up.";


/** Operator Sources — no self-href to the digests hub. */
export const DIGESTS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Advisory scan schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Architecture digests", href: inAppHelpHref("digests") },
  { label: "Alerts help", href: inAppHelpHref("alerts") },
] as const;

export const DIGESTS_CANONICAL_PATH = DIGESTS_HUB_PATH;
