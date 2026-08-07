import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUDIT_TRAIL_CLAIM_DISCIPLINE =
  "Audit events are an operator activity log for this workspace — not a signed-review diligence Sources package by themselves. Integrity export/verify when available strengthens provenance, but do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const AUDIT_TRAIL_SOURCES_INTRO =
  "Open the related architecture review or findings when an event needs follow-up; use Audit trail help for coverage expectations.";

export type AuditTrailSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/governance/audit`. */
export const AUDIT_TRAIL_SOURCES: readonly AuditTrailSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: "/governance/findings" },
  { label: "Decision register", href: "/governance/decision-register" },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const AUDIT_TRAIL_CANONICAL_PATH = "/governance/audit" as const;
