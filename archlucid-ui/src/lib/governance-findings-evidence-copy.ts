import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const GOVERNANCE_FINDINGS_CANONICAL_PATH = "/governance/findings" as const;

export const GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE =
  "Findings is the cross-review risk-register queue for disposition and ownership — it is not a signed-review diligence Sources package by itself. Open a finding detail, Evidence graph, or Audit when you need sponsor-safe trails.";

export const GOVERNANCE_FINDINGS_SOURCES_INTRO =
  "Use these follow-ups when queue triage turns into package detail, evidence search, or activity trails.";


/** Operator Sources — no self-href to the findings queue. */
export const GOVERNANCE_FINDINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Alert inbox", href: "/governance/alerts" },
  { label: "Decision register", href: "/governance/decision-register" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
