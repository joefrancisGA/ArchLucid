import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export { RECOMMENDATION_LEARNING_CANONICAL_PATH };

export const RECOMMENDATION_LEARNING_HELP_TOPIC_LABEL = "How recommendation learning works" as const;

export const RECOMMENDATION_LEARNING_CLAIM_DISCIPLINE =
  "Recommendation learning rebuilds ranking weights from historical advisory outcomes for architects — preview and rebuild are operational profile controls, not a sealed-review diligence Sources package. Open Advisory scans or Pilot feedback when you need live recommendation or feedback trails.";

export const RECOMMENDATION_LEARNING_SOURCES_INTRO =
  "Use these follow-ups when profile eligibility, rebuild impact, or architect feedback needs a live workflow trail.";


/** Operator Sources — no self-href to `/internal/recommendation-learning`. */
export const RECOMMENDATION_LEARNING_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Advisory scans", href: ADVISORY_SCANS_HREF },
  { label: "Pilot feedback", href: "/internal/product-learning" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Pilot feedback help", href: inAppHelpHref("pilot-feedback") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
