import { GOVERNANCE_SETUP_HREF } from "@/lib/governance/governance-setup-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";

export const GOVERNANCE_SETUP_CANONICAL_PATH = GOVERNANCE_SETUP_HREF;

export const GOVERNANCE_SETUP_CLAIM_DISCIPLINE =
  "Approval setup is a checklist that links to configuration pages — not a full audit export. It detects your policy baseline and alert ownership from workspace settings; you confirm thresholds, approvals, and reporting yourself. Open Findings, Audit, or Policy packs when you need live activity records.";

export const GOVERNANCE_SETUP_SOURCES_INTRO =
  "Use these follow-ups when setup steps turn into live configuration, triage, or activity records.";


/** Operator Sources — no self-href to /governance/setup. */
export const GOVERNANCE_SETUP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Alert rules", href: GOVERNANCE_ALERT_RULES_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Resolve outcomes help", href: inAppHelpHref("governance-approval") },
] as const;
