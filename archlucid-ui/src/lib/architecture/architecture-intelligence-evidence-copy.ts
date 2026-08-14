import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH = ARCHITECTURE_INTELLIGENCE_PATH;

export const ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL = "How architecture intelligence works";

export const ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE =
  "This Architecture intelligence page runs closed-loop reasoning and optional publish-to-findings - it is not a sealed-review diligence Sources package. Open Findings, Start a review, or Audit when you need live packages or assurance cites.";

export const ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO =
  "Use these follow-ups when reasoning output turns into findings triage, review intake, or assurance cites.";


/** Operator Sources - no self-href to architecture-intelligence. */
export const ARCHITECTURE_INTELLIGENCE_SOURCES: readonly EvidenceOrientationLink[] = [
  {
    label: "Findings",
    href: GOVERNANCE_FINDINGS_PATH,
    when: "Open the findings queue when published reasoning output needs governed triage",
  },
  {
    label: "Start a review",
    href: REVIEWS_NEW_PATH,
    when: "Start an evidence-backed architecture review when reasoning should become a full package",
  },
  {
    label: "Architecture reviews",
    href: REVIEWS_LIST_PATH,
    when: "Browse finalized reviews when reasoning should attach to an existing package",
  },
  {
    label: "Evidence trail help",
    href: inAppHelpHref("evidence-trail"),
    when: "Learn how findings and sealed records connect in the evidence trail",
  },
  {
    label: "Audit",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Open audit when published output needs a governed assurance trail with persisted cites",
  },
] as const;
