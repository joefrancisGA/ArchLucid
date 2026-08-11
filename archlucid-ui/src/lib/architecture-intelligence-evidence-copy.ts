import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture-intelligence-route";
import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH = ARCHITECTURE_INTELLIGENCE_PATH;

export const ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE =
  "This Architecture intelligence page runs closed-loop reasoning and optional publish-to-findings - it is not a signed-review diligence Sources package. Open Findings, Start a review, or Audit when you need live packages or assurance cites.";

export const ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO =
  "Use these follow-ups when reasoning output turns into findings triage, review intake, or assurance cites.";


/** Operator Sources - no self-href to architecture-intelligence. */
export const ARCHITECTURE_INTELLIGENCE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: "/governance/findings" },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Audit", href: "/governance/audit" },
] as const;
