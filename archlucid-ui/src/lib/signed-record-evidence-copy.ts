import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Workbook path pattern for MMX (dynamic manifest id). */
export const SIGNED_RECORD_CANONICAL_PATH_PATTERN = "/signed-records/[manifestId]" as const;

export const SIGNED_RECORD_CLAIM_DISCIPLINE =
  "This signed review record packages decisions, findings, and downloadable artifacts for one finalized review — it is application-layer lineage closure, not a CPA SOC 2 attestation or a published third-party pen-test report. Open Audit or Security & trust when you need broader assurance cites.";

export const SIGNED_RECORD_SOURCES_INTRO =
  "Use these follow-ups when the signed review needs findings triage, audit trail, or assurance cites.";

export type SignedRecordSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the dynamic signed-record path pattern. */
export const SIGNED_RECORD_SOURCES: readonly SignedRecordSourceLink[] = [
  { label: "Reviews help guide", href: inAppHelpHref("review-packages") },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Security & trust", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
