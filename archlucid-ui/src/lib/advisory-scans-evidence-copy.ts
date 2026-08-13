import { ADVISORY_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ADVISORY_SCANS_CANONICAL_PATH = ADVISORY_SCANS_HREF;

export const ADVISORY_SCANS_CLAIM_DISCIPLINE =
  "Advisory scan recommendations prioritize follow-up work from finalized reviews — they are not a signed-review diligence Sources package. Open Findings or Audit when you need a governed trail.";

export const ADVISORY_SCANS_SOURCES_INTRO =
  "Use these follow-ups when a scan needs an architecture review, findings triage, recurring schedules, or product orientation.";


/** Operator Sources — no self-href to the default advisory-scans hub path. */
export const ADVISORY_SCANS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Schedules tab", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
