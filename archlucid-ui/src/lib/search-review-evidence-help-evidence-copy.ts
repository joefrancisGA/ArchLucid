import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

import {
  SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO,
} from "@/lib/search-review-evidence-evidence-copy";

export const SEARCH_REVIEW_EVIDENCE_HELP_CANONICAL_PATH = "/help/search-review-evidence" as const;

export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING = "What search review evidence is not";

export const SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE = SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE;

export const SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO = SEARCH_REVIEW_EVIDENCE_SOURCES_INTRO;

/** Help Sources — no self-href to `/help/search-review-evidence`; compact wrap layout with when captions. */
export const SEARCH_REVIEW_EVIDENCE_HELP_SOURCES: readonly EvidenceOrientationLink[] = [
  {
    label: "Architecture reviews",
    href: "/architecture/reviews",
    when: "Open the reviews list when you need package context before searching",
  },
  {
    label: "Findings queue",
    href: GOVERNANCE_FINDINGS_PATH,
    when: "Route disposition work when a search hit surfaces an open finding",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow governed activity when search hits need accountability cites",
  },
  {
    label: "Evidence trail help",
    href: inAppHelpHref("evidence-trail"),
    when: "Read evidence trail guidance when graph navigation is the follow-up",
  },
  {
    label: "Findings help",
    href: inAppHelpHref("findings"),
    when: "Read findings guidance when queue workflow is the follow-up",
  },
] as const;
