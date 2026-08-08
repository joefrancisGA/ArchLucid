import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

export const ALERTS_INBOX_CLAIM_DISCIPLINE =
  "Alert inbox is the operational triage launcher for raised governance notifications — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Findings, Audit, or Alert rules when you need disposition trails or configuration evidence.";

export const ALERTS_INBOX_SOURCES_INTRO =
  "Use these follow-ups when inbox triage turns into finding disposition, rule configuration, or activity trails.";

export type AlertsInboxSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the alerts inbox. */
export const ALERTS_INBOX_SOURCES: readonly AlertsInboxSourceLink[] = [
  { label: "Alert rules", href: governanceAlertRulesTabHref("rules") },
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Integrations (webhooks)", href: "/integrations/webhooks" },
  { label: "How alerts work", href: inAppHelpHref("alerts") },
] as const;
