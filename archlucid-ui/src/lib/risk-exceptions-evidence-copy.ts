import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const RISK_EXCEPTIONS_CLAIM_DISCIPLINE =
  "Risk exceptions track time-bounded waivers for accepted findings — they are not a signed-review diligence Sources package. Open Findings, Audit, or a review workspace when you need sponsor-safe trails.";

export const RISK_EXCEPTIONS_SOURCES_INTRO =
  "Use these follow-ups when an exception needs finding disposition, package context, or an activity trail.";


/** Operator Sources — no self-href to exceptions. */
export const RISK_EXCEPTIONS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Governance findings", href: "/governance/findings" },
  { label: "Decision register", href: "/governance/decision-register" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
] as const;
