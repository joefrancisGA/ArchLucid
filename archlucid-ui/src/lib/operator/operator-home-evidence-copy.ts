import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const OPERATOR_HOME_CANONICAL_PATH = "/";

export const OPERATOR_HOME_CLAIM_DISCIPLINE =
  "Overview is the architect command center launcher for next actions, recent reviews, and directional ROI — it is not a signed-review diligence Sources package. Open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails.";

export const OPERATOR_HOME_SOURCES_INTRO =
  "Use these follow-ups when Overview next-actions need architecture reviews, findings triage, sponsor ROI, or first-run guidance.";


/** Operator Sources — no self-href to Overview `/`. */
export const OPERATOR_HOME_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Start review", href: "/architecture/reviews/new" },
  { label: "Sponsor dashboard", href: "/architecture/sponsor-dashboard" },
  { label: "Governance findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "First architecture review help", href: inAppHelpHref("first-architecture-review") },
] as const;
