import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_CANONICAL_PATH = ADVISORY_SCANS_HREF;

export const ADVISORY_SCANS_CLAIM_DISCIPLINE_HEADING = "What advisory scans are not";

export const ADVISORY_SCANS_CLAIM_DISCIPLINE =
  "Advisory scan output prioritizes follow-up work from finalized reviews. It is not a signed-review diligence Sources package — open Findings or Audit when you need a governed trail.";

export const ADVISORY_SCANS_SOURCES_INTRO =
  "Use these follow-ups when a scan needs an architecture review, governed audit trail, or product orientation.";

/** Operator Sources — no self-href to the default advisory-scans hub path or tile-covered destinations. */
export const ADVISORY_SCANS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
