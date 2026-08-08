import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_EVIDENCE_PROPOSALS_PATH } from "@/lib/internal-ops-route-paths";

export const EVIDENCE_PROPOSALS_CANONICAL_PATH = INTERNAL_EVIDENCE_PROPOSALS_PATH;

export const EVIDENCE_PROPOSALS_CLAIM_DISCIPLINE =
  "Evidence proposals are internal agent-suggested catalog candidates awaiting promote — they are not signed-review diligence Sources. Open System health or Evidence trail help when you need operational or provenance context.";

export const EVIDENCE_PROPOSALS_SOURCES_INTRO =
  "Use these follow-ups when proposal triage needs catalog, review, or evidence-trail context.";

export type EvidenceProposalsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to evidence-proposals. */
export const EVIDENCE_PROPOSALS_SOURCES: readonly EvidenceProposalsSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Evidence trail help", href: inAppHelpHref("evidence-trail") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;
