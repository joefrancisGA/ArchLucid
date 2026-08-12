import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const APPROVAL_QUEUE_CLAIM_DISCIPLINE =
  "This approval queue records submit / approve / reject decisions for architecture reviews in the current workspace — an architect workflow surface, not a complete diligence Sources package on its own. Open Audit or the linked review when you need the fuller trail.";

export const APPROVAL_QUEUE_SOURCES_INTRO =
  "Use these follow-ups when a decision needs findings triage, audit trail, workspace health, or governance orientation.";


/** Operator Sources — no self-href to the approval queue. */
export const APPROVAL_QUEUE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Workspace health", href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;

export const APPROVAL_QUEUE_CANONICAL_PATH = GOVERNANCE_APPROVAL_QUEUE_PATH;
