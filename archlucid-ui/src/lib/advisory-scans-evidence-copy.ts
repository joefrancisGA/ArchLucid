import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_CANONICAL_PATH = ADVISORY_SCANS_HREF;

export const ADVISORY_SCANS_CLAIM_DISCIPLINE_HEADING = "What advisory scans are not";

export const ADVISORY_SCANS_CLAIM_DISCIPLINE =
  "Advisory scan output prioritizes follow-up work from finalized reviews. It is not a sealed-review diligence Sources package — open Findings or Audit when you need a governed trail.";

export const ADVISORY_SCANS_SOURCES_INTRO =
  "Follow-ups for review intake, governed trails, AI spend signals, or product orientation.";

/** Operator Sources — no self-href to the default advisory-scans hub path or tile-covered destinations. */
export const ADVISORY_SCANS_SOURCES: readonly EvidenceSourceLink[] = [
  {
    label: "Audit",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Open governed audit trails when scan output needs assurance cites",
  },
  {
    label: "AI usage help",
    href: inAppHelpHref("ai-usage"),
    when: "Monitor estimated AI spend when scan generation adds model activity",
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Product orientation for architects new to advisory scans",
  },
] as const;
