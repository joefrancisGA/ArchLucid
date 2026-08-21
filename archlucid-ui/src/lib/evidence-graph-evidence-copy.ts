import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EVIDENCE_GRAPH_CANONICAL_PATH = EVIDENCE_GRAPH_PATH;

export const EVIDENCE_GRAPH_HELP_TOPIC_LABEL = "Evidence graph";

export const EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING = "What the evidence graph is not";

export const EVIDENCE_GRAPH_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.evidenceGraph;

export const EVIDENCE_GRAPH_CLAIM_DISCIPLINE =
  "The evidence graph shows how evidence links to findings, decisions, approvals, and audit records for a finalized review — not a full audit export.";

export const EVIDENCE_GRAPH_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "graph exploration needs review intake, search, compare, or evidence-trail methodology",
);

/** Operator Sources — no self-href to `/insights/evidence-graph`. */
export const EVIDENCE_GRAPH_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Architecture reviews",
    href: REVIEWS_LIST_PATH,
    when: "Pick a finalized review before the graph can load committed evidence",
  },
  {
    label: "Search review evidence",
    href: "/insights/search-review-evidence",
    when: "Search across findings and sealed records when graph questions need workspace-wide context",
  },
  {
    label: "Compare two reviews",
    href: "/insights/compare-two-reviews",
    when: "Contrast evidence chains when exploration turns into cross-review analysis",
  },
  {
    label: "Evidence trail help",
    href: inAppHelpHref("evidence-trail"),
    when: "Read trace-table and export methodology before briefing sponsors",
  },
  {
    label: "Start a review",
    href: REVIEWS_NEW_PATH,
    when: "Start an evidence-backed architecture review when no finalized package exists yet",
  },
] as const;
