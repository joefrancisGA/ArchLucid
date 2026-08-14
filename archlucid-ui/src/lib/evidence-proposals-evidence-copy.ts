import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_EVIDENCE_PROPOSALS_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const EVIDENCE_PROPOSALS_CANONICAL_PATH = INTERNAL_EVIDENCE_PROPOSALS_PATH;

export const EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL = "How evidence proposals work" as const;

export const EVIDENCE_PROPOSALS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE = "Where to go next";

export const EVIDENCE_PROPOSALS_CLAIM_HEADING_ID = "evidence-proposals-claim-discipline-heading" as const;

export const EVIDENCE_PROPOSALS_CLAIM_DISCIPLINE =
  "Evidence proposals are internal agent-suggested catalog candidates awaiting promote — they are not sealed-review diligence Sources. Open System health or Evidence trail help when you need operational or provenance context.";

export const EVIDENCE_PROPOSALS_SOURCES_INTRO =
  "Use these follow-ups when proposal triage needs catalog, review, or evidence-trail context.";

/** Operator Sources — no self-href to evidence-proposals. */
export const EVIDENCE_PROPOSALS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;
