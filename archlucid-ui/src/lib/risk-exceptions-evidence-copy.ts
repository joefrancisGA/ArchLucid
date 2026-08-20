import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const RISK_EXCEPTIONS_CANONICAL_PATH = GOVERNANCE_EXCEPTIONS_PATH;

export const RISK_EXCEPTIONS_HELP_TOPIC_LABEL = "How risk exceptions work";

export const RISK_EXCEPTIONS_CLAIM_DISCIPLINE =
  "Risk exceptions track temporary approvals to accept a known risk for accepted findings — they are not a full audit export on their own. Open Findings, Audit, or a review workspace when you need sponsor-safe trails.";

export const RISK_EXCEPTIONS_SOURCES_INTRO =
  "Use these follow-ups when an exception needs finding disposition, package context, or an activity trail.";


/** Operator Sources — no self-href to exceptions. */
export const RISK_EXCEPTIONS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;
