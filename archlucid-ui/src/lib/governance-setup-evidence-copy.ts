import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const GOVERNANCE_SETUP_CLAIM_DISCIPLINE =
  "Governance setup is a checklist guide that links into audited config workspaces — it is not a signed-review diligence Sources package. Open Findings, Audit, or Policy packs when you need live governance trails.";

export const GOVERNANCE_SETUP_SOURCES_INTRO =
  "Use these follow-ups when setup steps turn into live configuration, disposition, or activity trails.";


/** Operator Sources — no self-href to /governance/setup. */
export const GOVERNANCE_SETUP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Policy packs", href: "/governance/policy-packs" },
  { label: "Alert rules", href: "/governance/alert-rules" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;
