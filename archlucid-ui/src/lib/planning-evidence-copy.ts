import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const PLANNING_CLAIM_DISCIPLINE =
  "Themes and plans are derived from captured review feedback in the current workspace scope — not a sealed-review diligence Sources trail.";

export const PLANNING_SOURCES_INTRO =
  "Open reviews, findings, or product-learning before treating prioritized plans as executed commitments.";


/** Operator Sources — no self-href to `/insights/improvement-planning`. */
export const PLANNING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Product learning", href: "/internal/product-learning" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Pilot feedback help", href: inAppHelpHref("pilot-feedback") },
] as const;

export { PLANNING_PATH as PLANNING_CANONICAL_PATH } from "@/lib/planning-route";
