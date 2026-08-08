import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_SETUP_CLAIM_DISCIPLINE =
  "Governance setup is a checklist guide that links into audited config workspaces — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Findings, Audit, or Policy packs when you need live governance trails.";

export const GOVERNANCE_SETUP_SOURCES_INTRO =
  "Use these follow-ups when setup steps turn into live configuration, disposition, or activity trails.";

export type GovernanceSetupSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to /governance/setup. */
export const GOVERNANCE_SETUP_SOURCES: readonly GovernanceSetupSourceLink[] = [
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Policy packs", href: "/governance/policy-packs" },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;
