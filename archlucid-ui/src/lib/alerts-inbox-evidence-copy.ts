import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ALERTS_INBOX_CLAIM_DISCIPLINE =
  "Alert inbox is the operational triage launcher for raised governance notifications — it is not a signed-review diligence Sources package. Open Findings, Audit, or Alert rules when you need disposition trails or configuration evidence.";

export const ALERTS_INBOX_SOURCES_INTRO =
  "Use these follow-ups when inbox triage turns into finding disposition, rule configuration, or activity trails.";


/** Operator Sources — no self-href to the alerts inbox. */
export const ALERTS_INBOX_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Alert rules", href: governanceAlertRulesTabHref("rules") },
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
