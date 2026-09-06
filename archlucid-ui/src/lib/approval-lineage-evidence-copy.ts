import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Workbook path pattern for GAI (dynamic approval id). */
export const APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN =
  "/governance/approval-requests/[id]/lineage" as const;

export const APPROVAL_LINEAGE_HELP_TOPIC_LABEL = "How approval lineage works";

export const APPROVAL_LINEAGE_CLAIM_DISCIPLINE =
  "Approval lineage shows how one approval request connects to its review, findings, and finalized review record version. Use it to inspect links — not as a full audit export on its own. Open Audit or the architecture review when you need the fuller trail.";

export const APPROVAL_LINEAGE_SOURCES_INTRO =
  "Use these follow-ups when lineage needs queue context, findings triage, audit trail, or approval orientation.";


/** Operator Sources — no self-href to the dynamic lineage route pattern. */
export const APPROVAL_LINEAGE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;
