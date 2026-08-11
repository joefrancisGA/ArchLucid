import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AUDIT_TRAIL_CLAIM_DISCIPLINE =
  "Audit events are an workspace activity log for this workspace — not a signed-review diligence Sources package by themselves. Integrity export/verify when available strengthens provenance for architects";

export const AUDIT_TRAIL_SOURCES_INTRO =
  "Open the related architecture review or findings when an event needs follow-up; use Audit trail help for coverage expectations.";


/** Operator Sources — no self-href to `/governance/audit`. */
export const AUDIT_TRAIL_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: "/governance/findings" },
  { label: "Decision register", href: "/governance/decision-register" },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const AUDIT_TRAIL_CANONICAL_PATH = "/governance/audit" as const;
