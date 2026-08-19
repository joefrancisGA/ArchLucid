import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Alias for existing imports — prefer {@link GOVERNANCE_FINDINGS_PATH}. */
export const GOVERNANCE_FINDINGS_CANONICAL_PATH = GOVERNANCE_FINDINGS_PATH;

export const GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE =
  "Findings is the cross-review risk-register queue for disposition and ownership — it is not a sealed-review diligence Sources package by itself. Open a finding detail, Evidence graph, or Audit when you need sponsor-safe trails.";

export const GOVERNANCE_FINDINGS_CLAIM_HEADING = "What the findings queue is not";

export const GOVERNANCE_FINDINGS_SOURCES_INTRO =
  "Use these follow-ups when queue triage turns into package detail, evidence search, or activity trails.";


/** Operator Sources — no self-href to the findings queue. */
export const GOVERNANCE_FINDINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Alert inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
