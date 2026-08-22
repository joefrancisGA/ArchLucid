import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const REVIEWS_HUB_CLAIM_DISCIPLINE =
  "Architecture reviews lists draft, active, and finalized packages — not a full audit export by itself. Open a review workspace, Evidence graph, or Audit when you need export-ready records.";

export const REVIEWS_HUB_SOURCES_INTRO =
  "Use these follow-ups when list browsing turns into package detail, evidence search, or approval activity.";


/** Operator Sources — no self-href to the reviews list hub. */
export const REVIEWS_HUB_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Evidence graph", href: "/insights/evidence-graph" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Review packages help", href: inAppHelpHref("review-packages") },
] as const;
