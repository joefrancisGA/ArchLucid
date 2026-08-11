import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Workbook path pattern for MMX (dynamic manifest id). */
export const SIGNED_RECORD_CANONICAL_PATH_PATTERN = "/governance/signed-records/[manifestId]" as const;

export const SIGNED_RECORD_CLAIM_DISCIPLINE =
  "This signed review record packages decisions, findings, and downloadable artifacts for one finalized review — it is application-layer lineage closure. Open Audit or Assurance status when you need broader assurance cites.";

export const SIGNED_RECORD_SOURCES_INTRO =
  "Use these follow-ups when the signed review needs findings triage, audit trail, or assurance cites.";


/** Operator Sources — no self-href to the dynamic signed-record path pattern. */
export const SIGNED_RECORD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Reviews help guide", href: inAppHelpHref("review-packages") },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Assurance status", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
