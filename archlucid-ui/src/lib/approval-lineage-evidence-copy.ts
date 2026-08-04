import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Workbook path pattern for GAI (dynamic approval id). */
export const APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN =
  "/governance/approval-requests/[id]/lineage" as const;

export const APPROVAL_LINEAGE_CLAIM_DISCIPLINE =
  "Approval lineage links an approval request to its review, findings, and signed-record version — it is a governance linkage view, not a complete diligence Sources package on its own, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Audit or the architecture review when you need the fuller trail.";

export const APPROVAL_LINEAGE_SOURCES_INTRO =
  "Use these follow-ups when lineage needs queue context, findings triage, audit trail, or governance orientation.";

export type ApprovalLineageSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the dynamic lineage route pattern. */
export const APPROVAL_LINEAGE_SOURCES: readonly ApprovalLineageSourceLink[] = [
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;
